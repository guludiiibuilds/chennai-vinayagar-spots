// The SVG is icon-only (a mango-shaped Ganesha mark) — the "Chennai
// Vinayagar" wordmark is set here in the app's own display font instead of
// baked into the artwork, so it stays crisp at any size and shares type
// with the rest of the UI rather than shipping a second typeface. `size`
// sets the wordmark's font-size; the icon renders larger than that (see
// iconSize below) because the artwork itself sits well inset within its
// own square canvas — at 1:1 with the text it visibly reads as smaller.
export default function Logo({ size = 40, showWordmark = true }) {
  const iconSize = Math.round(size * 1.4);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.05) }}>
      <img
        src="/brand/logo.svg"
        alt={showWordmark ? "" : "Chennai Vinayagar"}
        width={iconSize}
        height={iconSize}
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
