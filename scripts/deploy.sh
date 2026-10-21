#!/usr/bin/env bash
# Migrates the prod database, builds and pushes the web image, then rolls the
# ECS Express Mode service to it. Run from a clean tree with AWS credentials, and
# set ECS_SERVICE_ARN and DB_SECURITY_GROUP (the RDS security group).
# SKIP_ROLLOUT=1 stops after the push.
set -euo pipefail

export AWS_REGION="${AWS_REGION:-ap-southeast-2}"
: "${ECS_SERVICE_ARN:?Set ECS_SERVICE_ARN}"
: "${DB_SECURITY_GROUP:?Set DB_SECURITY_GROUP}"
# The tag starts with the creation time, so a later run can tell when a rule is stale.
RULE_TAG="cmo-deploy-$(date +%s)-${GITHUB_RUN_ID:-local}"

cd "$(git rev-parse --show-toplevel)"

# The image tag names a commit, so uncommitted changes would ship under the wrong tag.
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash first." >&2
  exit 1
fi
SHA="$(git rev-parse --short HEAD)"

# The service already names its image repo and secrets, so the script reads them from it.
SERVICE_JSON="$(aws ecs describe-express-gateway-service --service-arn "$ECS_SERVICE_ARN" --output json)"
CURRENT_IMAGE="$(jq -r '.service.activeConfigurations[0].primaryContainer.image' <<<"$SERVICE_JSON")"
IMAGE="${CURRENT_IMAGE%:*}"
REGISTRY="${IMAGE%%/*}"
secret_arn() {
  jq -r --arg name "$1" '.service.activeConfigurations[0].primaryContainer.secrets[] | select(.name == $name) | .valueFrom' <<<"$SERVICE_JSON"
}

TMP="$(mktemp -d)"
RULE_ID=""

close_rule() {
  [ -n "$RULE_ID" ] || return 0
  aws ec2 revoke-security-group-ingress --group-id "$DB_SECURITY_GROUP" \
    --security-group-rule-ids "$RULE_ID" >/dev/null && RULE_ID=""
}

cleanup() {
  close_rule || echo "Could not remove rule $RULE_ID from $DB_SECURITY_GROUP. Remove it by hand." >&2
  rm -rf "$TMP"
}
trap cleanup EXIT
trap 'exit 1' INT TERM

# pg verifies the RDS certificate, and Node does not trust the RDS CA by default.
curl -fsS https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem -o "$TMP/rds-ca.pem"
export NODE_EXTRA_CA_CERTS="$TMP/rds-ca.pem"

DATABASE_URL="$(aws secretsmanager get-secret-value --secret-id "$(secret_arn DATABASE_URL)" --query SecretString --output text)"
PAYLOAD_SECRET="$(aws secretsmanager get-secret-value --secret-id "$(secret_arn PAYLOAD_SECRET)" --query SecretString --output text)"
export DATABASE_URL PAYLOAD_SECRET

# A killed run can leave its rule open, so remove rules older than an hour before adding a new one.
# A younger rule can belong to a deploy that is still running. A rule with no timestamp counts as stale.
STALE_RULES="$(aws ec2 describe-security-group-rules --filters "Name=group-id,Values=$DB_SECURITY_GROUP" --output json |
  jq -r --argjson cutoff "$(($(date +%s) - 3600))" '.SecurityGroupRules[] | select(.IsEgress | not)
    | select((.Description // "") | startswith("cmo-deploy-"))
    | select(((.Description | capture("^cmo-deploy-(?<t>[0-9]+)-").t | tonumber) // 0) < $cutoff)
    | .SecurityGroupRuleId')"
for id in $STALE_RULES; do
  echo "Removing stale rule $id"
  aws ec2 revoke-security-group-ingress --group-id "$DB_SECURITY_GROUP" --security-group-rule-ids "$id" >/dev/null
done

# RDS only accepts listed IPs, so let this machine in for the migrate and the build.
IP="$(curl -fsS https://checkip.amazonaws.com)"
RULE_ID="$(aws ec2 authorize-security-group-ingress --group-id "$DB_SECURITY_GROUP" \
  --ip-permissions "IpProtocol=tcp,FromPort=5432,ToPort=5432,IpRanges=[{CidrIp=$IP/32,Description=$RULE_TAG}]" \
  --query 'SecurityGroupRules[0].SecurityGroupRuleId' --output text)"
echo "Opened $RULE_ID"

aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"

# The docker driver cannot export a registry cache, so use a docker-container builder.
docker buildx inspect cmo-deploy >/dev/null 2>&1 || docker buildx create --name cmo-deploy --driver docker-container >/dev/null

pnpm --filter web migrate

# --provenance=false stops attestation manifests from filling the ECR lifecycle limit.
BUILD_SECRETS_HASH="$(printf '%s\n%s' "$DATABASE_URL" "$PAYLOAD_SECRET" | sha256sum | cut -d' ' -f1)"
docker buildx build --builder cmo-deploy -f apps/web/Dockerfile \
  --platform linux/amd64 --provenance=false \
  --secret id=DATABASE_URL,env=DATABASE_URL --secret id=PAYLOAD_SECRET,env=PAYLOAD_SECRET \
  --build-arg NODE_VERSION="$(cat .nvmrc)" --build-arg BUILD_SECRETS_HASH="$BUILD_SECRETS_HASH" \
  --cache-from "type=registry,ref=$IMAGE:buildcache" \
  --cache-to "type=registry,ref=$IMAGE:buildcache,mode=max,image-manifest=true,oci-mediatypes=true" \
  -t "$IMAGE:$SHA" --push .

close_rule
echo "Pushed image $SHA"

if [ "${SKIP_ROLLOUT:-}" = "1" ]; then
  exit 0
fi

# --primary-container replaces the whole container, so keep its env and secrets and change only the image.
CLUSTER="$(jq -r '.service.cluster' <<<"$SERVICE_JSON")"
SERVICE="$(jq -r '.service.serviceName' <<<"$SERVICE_JSON")"
CONTAINER="$(jq -c --arg img "$IMAGE:$SHA" '.service.activeConfigurations[0].primaryContainer | .image = $img' <<<"$SERVICE_JSON")"

aws ecs update-express-gateway-service --service-arn "$ECS_SERVICE_ARN" --primary-container "$CONTAINER" >/dev/null
echo "Waiting for the service to become stable"
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"

# services-stable also passes after a rollback, so check that the primary deployment runs the new image.
TASK_DEF="$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --output json |
  jq -r '.services[0].deployments[] | select(.status == "PRIMARY") | .taskDefinition')"
RUNNING_IMAGES="$(aws ecs describe-task-definition --task-definition "$TASK_DEF" --output json |
  jq -r '.taskDefinition.containerDefinitions[].image')"
if ! grep -qxF "$IMAGE:$SHA" <<<"$RUNNING_IMAGES"; then
  echo "Rollout failed. The primary deployment runs $TASK_DEF, which does not use image $SHA." >&2
  exit 1
fi
echo "Deployed image $SHA"
