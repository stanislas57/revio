import { encode } from "uqr";

/**
 * A QR code drawn as SVG paths by React (no HTML injected). Always black on white with a 4-module quiet zone,
 * whatever the theme, so every scanner reads it. Decorative for screen readers: the link is written next to it.
 */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const { data, size } = encode(value, { ecc: "M", border: 0 });
  const quiet = 4;
  const total = size + quiet * 2;
  let path = "";
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }),
  );
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label="QR code de ton lien d'invitation"
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
