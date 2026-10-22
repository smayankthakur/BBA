import { LINKS, MULANKS } from "@/data/home";

export default function MulankPicker() {
  return (
    <section id="number" className="number">
      <div className="number-inner">
        <h2 className="h2">Or start with your number</h2>
        <p>
          Add the digits of the day you were born until one is left. Born on the 25th? 2 + 5 makes you
          a 7. Tap your number and ask Ammit which crystals suit it.
        </p>
        <div role="group" aria-label="Choose your mulank" className="numbers">
          {MULANKS.map((n) => (
            <a
              key={n}
              className="numb"
              href={LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Mulank ${n}: ask Ammit on WhatsApp`}
            >
              {n}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
