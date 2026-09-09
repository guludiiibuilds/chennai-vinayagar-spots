// A simple wordmark lockup: a small trunk-swirl glyph (echoing the map
// pin's Vinayaka motif at a distance instead of duplicating it exactly)
// next to the app name. Placeholder for a real logo — swap the <svg> for
// an <img> once one exists, everything else (sizing, layout) stays put.
export default function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flex: "none" }}>
        <circle cx="12" cy="12" r="12" fill="var(--accent)" />
        <path
          d="M8.5 9.5c0-1.8 1.5-3.2 3.4-3.2 1.9 0 3.3 1.3 3.3 3 0 1.4-.8 2.2-1.8 2.9-.9.6-1.4 1-1.4 1.8v.6"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11.9" cy="17.3" r="1.05" fill="#fff" />
      </svg>
      <span style={{ font: "700 17px/1 var(--font-display)", letterSpacing: "-.374px", color: "var(--ink)" }}>
        Chennai Vinayagar
      </span>
    </div>
  );
}
