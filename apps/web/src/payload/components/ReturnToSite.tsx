// Plain <a>, not next/link: the site and the admin panel have separate root layouts,
// so the browser does a full page load either way.

export function ReturnToSiteLoginLink() {
  return (
    <a className="return-to-site" href="/">
      ← Back to site
    </a>
  )
}

export function ReturnToSiteNavLink() {
  return (
    <a className="nav__link return-to-site" href="/">
      <span className="nav__link-label">← Back to site</span>
    </a>
  )
}
