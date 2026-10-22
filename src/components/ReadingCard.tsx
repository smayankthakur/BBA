import Image from "next/image";
import { MULANK } from "@/data/pages";

export type ReadingCardData = {
  name: string;
  dob: string; // display string, e.g. 25 March 1995
  mulank: number;
  bhagyank: number;
  bracelet: string;
  crystals: string[];
  note?: string;
  /** "suggested" (from the website reading) or "chosen" (staff card after Ammit's reading) */
  kind: "suggested" | "chosen";
};

/** Printable reading card (A6-style). Used by the funnel and the staff tool. */
export default function ReadingCard({ d }: { d: ReadingCardData }) {
  const m = MULANK.find((x) => x.number === d.mulank);
  return (
    <div className="rc">
      <div className="rc-zari" aria-hidden="true" />
      <div className="rc-head">
        <span className="rc-medal">
          <Image src="/brand/emblem.png" alt="" width={44} height={49} />
        </span>
        <div>
          <p className="rc-brand">Bracelet By Ammit</p>
          <p className="rc-sub">Your crystal reading</p>
        </div>
      </div>
      <p className="rc-name">{d.name}</p>
      <p className="rc-dob">Born {d.dob}</p>
      <div className="rc-nums">
        <div>
          <b>{d.mulank}</b>
          <span>Mulank{m ? ` · ${m.planet}` : ""}</span>
        </div>
        <div>
          <b>{d.bhagyank}</b>
          <span>Bhagyank</span>
        </div>
      </div>
      {m && (
        <p className="rc-traits">
          {m.traits.join(" · ")}
        </p>
      )}
      <div className="rc-row">
        <span className="rc-k">{d.kind === "chosen" ? "Your bracelet" : "Suggested bracelet"}</span>
        <span className="rc-v">{d.bracelet}</span>
      </div>
      <div className="rc-row">
        <span className="rc-k">{d.kind === "chosen" ? "Crystals chosen for you" : "Crystals often used"}</span>
        <span className="rc-v">{d.crystals.join(", ")}</span>
      </div>
      {d.note && <p className="rc-note">{d.note}</p>}
      <div className="rc-foot">
        <span className="rc-sign">Ammit Kukreja</span>
        <span className="rc-role">Numerologist</span>
      </div>
      <p className="rc-fine">
        {d.kind === "chosen"
          ? "Read and strung by hand for the wearer's numbers."
          : "A first suggestion from your date of birth. Ammit confirms the final stones after reading your full name and date of birth."}{" "}
        Traditional guidance, not medical, legal or financial advice.
      </p>
    </div>
  );
}
