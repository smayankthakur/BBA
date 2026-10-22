/** Glossy crystal bead used on cards and rows. */
export default function Sphere({
  color,
  shade,
  gloss = 0.95,
  size = 60,
  className = "",
}: {
  color: string;
  shade: string;
  gloss?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`sphere-bead ${className}`.trim()}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        backgroundImage: `radial-gradient(circle at 30% 30%,rgba(255,255,255,${gloss}) 0 6%,rgba(255,255,255,0) 30%),radial-gradient(circle,rgba(0,0,0,0) 40%,${shade} 100%)`,
      }}
    />
  );
}
