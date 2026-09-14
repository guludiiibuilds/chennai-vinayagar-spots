// The SVG is icon-only (a mango-shaped Ganesha mark) — the wordmark is set
// here in the app's own display font instead of baked into the artwork, so
// it stays crisp at any size and shares type with the rest of the UI
// rather than shipping a second typeface. `size` sets the icon's size (see
// iconSize below, larger than the text because the artwork itself sits
// well inset within its own square canvas — at 1:1 with the text it
// visibly reads as smaller); the wordmark's own font-size is derived from
// it at a smaller ratio since "Ganesh Chaturthi Idol Tracking" is a full
// phrase, not the short compact mark this ratio originally fit.
export default function Logo({ size = 40, showWordmark = true }) {
  const iconSize = Math.round(size * 1.4);
  const wordmarkSize = Math.round(size * 0.55);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <img
        src="/brand/logo.svg"
        alt={showWordmark ? "" : "Ganesh Chaturthi Idol Tracking"}
        width={iconSize}
        height={iconSize}
        style={{ display: "block", flex: "none" }}
      />
      {showWordmark ? (
        <span
          style={{
            fontFamily: "'Baloo 2', ui-rounded, 'SF Pro Rounded', 'Segoe UI', sans-serif",
            fontSize: wordmarkSize,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "var(--ink)" }}>Ganesh Chaturthi </span><span style={{ color: "var(--accent)" }}>Idol Tracking</span>
        </span>
      ) : null}
    </div>
  );
}
