/** Separate icon and wordmark sizing keeps the text readable in the header. */
export function BrandLogo({ theme }: { theme: "light" | "dark" }) {
  return (
    <>
      <img
        className="babycare-brand-icon"
        src="/branding/babycare-sidebar-icon.png"
        alt=""
        width="38"
        height="38"
      />
      <svg
        className="babycare-brand-wordmark"
        viewBox="700 265 1245 340"
        aria-hidden="true"
        focusable="false"
      >
        <image href={`/branding/babycare-logo-${theme}.png`} width="1961" height="802" />
      </svg>
    </>
  );
}
