import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import VideoEmbed from "@/components/VideoEmbed";
import { birthDaysFor } from "@/data/pages";
import { getContent, getSite } from "@/lib/server/content";
import { fill } from "@/lib/content/render";

type Params = { params: Promise<{ number: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ number: String(n) }));
}

async function get(n: string) {
  const c = await getContent("mulank");
  return { c, m: c.numbers.find((x) => String(x.number) === n) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { m } = await get((await params).number);
  if (!m) return {};
  return {
    title: `Mulank ${m.number}: ruled by ${m.planet}`,
    description: `${m.summary} Born on ${birthDaysFor(m.number).join(", ")}. Find crystals for your numbers with Ammit Kukreja.`,
    alternates: { canonical: `/mulank/${m.number}` },
  };
}

export default async function MulankPage({ params }: Params) {
  const [{ c, m }, { s }] = await Promise.all([get((await params).number), getSite()]);
  if (!m) notFound();
  const days = birthDaysFor(m.number);
  const prev = m.number === 1 ? 9 : m.number - 1;
  const next = m.number === 9 ? 1 : m.number + 1;
  const v = { n: m.number, planet: m.planet, planetHindi: m.planetHindi };

  return (
    <PageShell>
      <div className="mulank-hero">
        <div className="mulank-medal" aria-hidden="true">
          <span>{m.number}</span>
        </div>
        <div>
          <PageHero
            crumbs={[{ label: "Mulank", href: "/mulank" }, { label: `Mulank ${m.number}` }]}
            eyebrow={fill(c.detailEyebrow, v)}
            title={`Mulank ${m.number}`}
            lede={<p>{m.summary}</p>}
          >
            <Link className="btn btn-lapis" href="/consultation">
              {c.detailAsk}
            </Link>
            <Link className="btn btn-line" href="/find-your-bracelet">
              {c.detailFind}
            </Link>
          </PageHero>
        </div>
      </div>

      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">{fill(c.daysTitle, v)}</h2>
          <ul className="day-list" aria-label={`Days that make mulank ${m.number}`}>
            {days.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="small-note">{c.daysNote}</p>
        </div>
        <div>
          <h2 className="h3">{fill(c.traitsTitle, v)}</h2>
          <ul className="tick-list">
            {m.traits.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-narrow prose-section">
        <h2 className="h2">{fill(c.crystalsTitle, v)}</h2>
        <p>{fill(c.crystalsText, v)}</p>
        <p>
          Ammit explains each number in short videos on{" "}
          <a href={s.youtube} target="_blank" rel="noopener noreferrer">
            his YouTube channel
          </a>
          .
        </p>
      </section>

      {m.videoId && (
        <section className="section-narrow video-section" aria-labelledby="mvideo-title">
          <h2 id="mvideo-title" className="h3">
            {fill(c.videoTitle, v)}
          </h2>
          <VideoEmbed video={{ id: m.videoId, title: `Mulank ${m.number}` }} />
        </section>
      )}

      <nav className="section-narrow pager" aria-label="Other numbers">
        <Link href={`/mulank/${prev}`}>← Mulank {prev}</Link>
        <Link href="/mulank">All numbers</Link>
        <Link href={`/mulank/${next}`}>Mulank {next} →</Link>
      </nav>

      <OrderCta secondary={{ label: "Book a consultation", href: "/consultation" }} />
    </PageShell>
  );
}
