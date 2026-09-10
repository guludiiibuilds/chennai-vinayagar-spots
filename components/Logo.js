const ASPECT = 2991 / 645;

// Hand-lettered "Chennai Vinayagar" wordmark, exported from the design
// system as a single vector (icon + type already fused into one mark, no
// separate glyph to lay out) — rendered at a fixed aspect ratio from its
// own height.
export default function Logo({ size = 22 }) {
  return (
    <img
      src="/brand/logo.svg"
      alt="Chennai Vinayagar"
      height={size}
      width={Math.round(size * ASPECT)}
      style={{ display: "block" }}
    />
  );
}
