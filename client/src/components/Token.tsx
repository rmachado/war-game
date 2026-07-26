interface TokenProps {
  alive: boolean;
  color: string;
}

export default function Token({ alive, color }: TokenProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      width="28"
      height="28"
      style={{
        opacity: alive ? 1 : 0.25,
        filter: alive ? "none" : "grayscale(1)",
      }}
    >
      <circle
        cx="14"
        cy="14"
        r="12"
        fill={color}
        stroke="#333"
        strokeWidth="1.5"
      />
      <circle
        cx="14"
        cy="14"
        r="7"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
    </svg>
  );
}
