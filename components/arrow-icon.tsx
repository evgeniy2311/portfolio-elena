export function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path d={direction === "right" ? "M5 12h14M14 6l6 6-6 6" : "M19 12H5m5 6-6-6 6-6"} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
