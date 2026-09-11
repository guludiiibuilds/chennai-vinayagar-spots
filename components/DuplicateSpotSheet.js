"use client";

import DuplicateSpotWarning from "./DuplicateSpotWarning";

// Standalone scrim + bottom sheet, for contexts with no sheet already
// open (the submit form's pasted-Google-Maps-link field). Where a sheet
// is already open (the map location picker), DuplicateSpotWarning is
// dropped directly into that existing sheet instead of using this — see
// LocationConfirmSheet.
export default function DuplicateSpotSheet({ spot, onCancel, onContinue }) {
  if (!spot) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--card)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          boxShadow: "var(--shadow-lg)",
          padding: "20px 20px 18px",
          animation: "fadeUp .22s ease both",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 16px" }} />
        <DuplicateSpotWarning spot={spot} onCancel={onCancel} onContinue={onContinue} />
      </div>
    </div>
  );
}
