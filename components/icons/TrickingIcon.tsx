/**
 * Icona tricking: ginnasta/acrobazia.
 * Da svgrepo.com - adattata per React con currentColor.
 */
export function TrickingIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="60 20 280 360"
      fill="none"
      stroke="currentColor"
      strokeWidth="34"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M243.588 269.023C289.642 226.584 314.414 326.789 246.707 311.794C237.3 309.711 231.803 298.951 232.662 286.132" />
      <path d="M305.598 194.543C235.842 212.277 174.827 279.826 199.386 353.504" />
      <path d="M83.9062 178.861C186.641 192.636 274.756 146.273 317 47.7021" />
      <path d="M215.074 162.468C215.292 186.242 216.493 210.201 222.203 233.036" />
    </svg>
  );
}
