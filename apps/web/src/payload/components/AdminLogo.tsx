import { Logo } from "@/components/Logo"

/** Login screen logo: the navbar's cap and wordmark. Styled in (payload)/custom.scss. */
export function AdminLogo() {
  return (
    <div className="admin-logo">
      <Logo className="admin-logo__cap" />
      <span className="admin-logo__wordmark">CCCA</span>
    </div>
  )
}
