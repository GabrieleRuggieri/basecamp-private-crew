/**
 * Icona NFC — solo scritta.
 */
export function NfcIcon({ className, size = 64 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="currentColor"
        fontSize="14"
        fontWeight="600"
        letterSpacing="0.2em"
      >
        NFC
      </text>
    </svg>
  );
}
