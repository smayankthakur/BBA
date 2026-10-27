import Link from "next/link";
import { MULANKS } from "@/data/home";
import { getContent } from "@/lib/server/content";

export default async function MulankPicker() {
  const c = await getContent("home");
  return (
    <section id="number" className="number">
      <div className="number-inner">
        <h2 className="h2">{c.numberTitle}</h2>
        <p>{c.numberText}</p>
        <div role="group" aria-label="Choose your mulank" className="numbers">
          {MULANKS.map((n) => (
            <Link key={n} className="numb" href={`/mulank/${n}`} aria-label={`Mulank ${n}`}>
              {n}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
