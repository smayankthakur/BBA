import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { MULANK, birthDaysFor } from "@/data/pages";
import { LINKS } from "@/data/home";
import VideoEmbed from "@/components/VideoEmbed";
import { MULANK_VIDEOS } from "@/data/videos";

type Params = { params: Promise<{ number: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MULANK.map((m) => ({ number: String(m.number) }));
}

const get = (n: string) => MULANK.find((m) => String(m.number) === n);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const m = get((await params).number);
  if (!m) return {};
  return {
    title: `Mulank ${m.number}: ruled by ${m.planet}`,
    description: `${m.summary} Born on ${birthDaysFor(m.number).join(", ")}. Find crystals for your numbers with Ammit Kukreja.`,
    alternates: { canonical: `/mulank/${m.number}` },
  };
}

export default async function MulankPage({ params }: Params) {
  const m = get((await params).number);
  if (!m) notFound();
  const days = birthDaysFor(m.number);
  const prev = m.number === 1 ? 9 : m.number - 1;
  const next = m.number === 9 ? 1 : m.number + 1;

  return (
    <PageShell>
      <div className="mulank-hero">
        <div className="mulank-medal" aria-hidden="true">
          <span>{m.number}</span>
        </div>
        <div>
          <PageHero
            crumbs={[{ label: "Mulank", href: "/mulank" }, { label: `Mulank ${m.number}` }]}
            eyebrow={`Ruled by ${m.planet} (${m.planetHindi})`}
            title={`Mulank ${m.number}`}
            lede={<p>{m.summary}</p>}
          >
            <a className="btn btn-lapis" href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
              Ask Ammit about my crystals
            </a>
            <Link className="btn btn-line" href="/find-your-bracelet">
              Find my bracelet
            </Link>
          </PageHero>
        </div>
      </div>

      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">You&apos;re a {m.number} if you were born on</h2>
          <ul className="day-list" aria-label={`Days that make mulank ${m.number}`}>
            {days.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="small-note">of any month.</p>
        </div>
        <div>
          <h2 className="h3">Qualities traditionally linked with {m.number}</h2>
          <ul className="tick-list">
            {m.traits.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-narrow prose-section">
        <h2 className="h2">Which crystals suit a {m.number}?</h2>
        <p>
          It depends on more than your mulank. Ammit also reads your bhagyank and how your numbers work together, so two
          people with mulank {m.number} can need different stones. Send him your full date of birth and he&apos;ll tell
          you which crystals suit you, and which to avoid.
        </p>
        <p>
          Ammit explains each number in short videos on{" "}
          <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
            his YouTube channel
          </a>
          .
        </p>
      </section>

      {MULANK_VIDEOS[m.number] && (
        <section className="section-narrow video-section" aria-labelledby="mvideo-title">
          <h2 id="mvideo-title" className="h3">
            Ammit on mulank {m.number}
          </h2>
          <VideoEmbed video={MULANK_VIDEOS[m.number]} />
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
