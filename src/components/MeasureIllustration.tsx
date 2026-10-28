/** Original line illustration: thread around a wrist, then laid on a ruler. */
export default function MeasureIllustration({ text }: { text: { title: string; step1: string; step2: string } }) {
  const ticks = Array.from({ length: 21 }, (_, i) => i);
  return (
    <svg className="measure-svg" viewBox="0 0 520 260" role="img" aria-labelledby="measure-title">
      <title id="measure-title">{text.title}</title>
      {/* Step 1: wrist with thread */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 70 C 60 60, 120 60, 150 70 L 160 200 C 130 210, 70 210, 50 200 Z" stroke="#2A3170" strokeWidth="2" fill="#FFFFFF" />
        <path d="M58 92 C 80 104, 130 104, 154 92" stroke="#7A3FC0" strokeWidth="5" />
        <path d="M58 92 C 80 80, 130 80, 154 92" stroke="#7A3FC0" strokeWidth="5" strokeDasharray="2 8" opacity="0.55" />
        <circle cx="154" cy="92" r="6" fill="#E3C67C" stroke="#B8913D" strokeWidth="2" />
      </g>
      <text x="100" y="236" textAnchor="middle" fontFamily="var(--sans)" fontSize="15" fontWeight="700" fill="#050E8F">{text.step1}</text>
      {/* arrow */}
      <path d="M195 135 H 245 M 235 125 L 247 135 L 235 145" fill="none" stroke="#B8913D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Step 2: thread on ruler */}
      <g>
        <rect x="270" y="120" width="230" height="46" rx="6" fill="#FFFFFF" stroke="#2A3170" strokeWidth="2" />
        {ticks.map((t) => (
          <line key={t} x1={282 + t * 10.3} y1={120} x2={282 + t * 10.3} y2={t % 5 === 0 ? 140 : 132} stroke="#2A3170" strokeWidth={t % 5 === 0 ? 1.6 : 1} />
        ))}
        {[0, 5, 10, 15, 20].map((n, i) => (
          <text key={n} x={282 + i * 51.5} y={158} textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fill="#2A3170">
            {n}
          </text>
        ))}
        <line x1="282" y1="104" x2="436" y2="104" stroke="#7A3FC0" strokeWidth="5" strokeLinecap="round" />
        <circle cx="436" cy="104" r="6" fill="#E3C67C" stroke="#B8913D" strokeWidth="2" />
        <path d="M436 112 V 140" stroke="#B8913D" strokeWidth="2" strokeDasharray="3 3" />
      </g>
      <text x="385" y="236" textAnchor="middle" fontFamily="var(--sans)" fontSize="15" fontWeight="700" fill="#050E8F">{text.step2}</text>
    </svg>
  );
}
