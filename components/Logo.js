// The SVG is icon-only (a mango-shaped Ganesha mark) — the "Chennai
// Vinayagar" wordmark is set here in the app's own display font instead of
// baked into the artwork, so it stays crisp at any size and shares type
// with the rest of the UI rather than shipping a second typeface. `size`
// is the icon's square size in px; the wordmark scales off it.
export default function Logo({ size = 40, showWordmark = true }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.08) }}>
      <img
        src="/brand/logo.svg"
        alt={showWordmark ? "" : "Chennai Vinayagar"}
        width={size}
        height={size}
        style={{ display: "block", flex: "none" }}
      />
      {showWordmark ? (
        <span
          style={{
            fontFamily: "'Baloo 2', ui-rounded, 'SF Pro Rounded', 'Segoe UI', sans-serif",
            fontSize: size,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "var(--ink)" }}>Chn</span><span style={{ color: "var(--accent)" }}>Vinayagar</span>
        </span>
      ) : null}
    </div>
  );
}
