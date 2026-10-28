"use client";

import { useState } from "react";
import Medallion from "./Medallion";

/** Reel id from an Instagram reel/post link, or null. */
export const reelId = (url: string) => /instagram\.com\/(?:reel|reels|p)\/([\w-]{5,40})/.exec(url)?.[1] ?? null;

/**
 * Click-to-play Instagram reel. Nothing loads from Instagram until the
 * visitor presses play.
 */
export default function InstagramReel({ url, title, note }: { url: string; title: string; note: string }) {
  const [play, setPlay] = useState(false);
  const id = reelId(url);
  if (!id) return null;
  return (
    <figure className="vid">
      <div className="vid-frame">
        {play ? (
          <iframe src={`https://www.instagram.com/reel/${id}/embed/`} title={title} allow="autoplay; encrypted-media; fullscreen" allowFullScreen loading="lazy" />
        ) : (
          <button type="button" className="vid-poster" onClick={() => setPlay(true)} aria-label={`Play video: ${title}`}>
            <Medallion width={40} height={44} />
            <span className="vid-title">{title}</span>
            <span className="vid-play" aria-hidden="true">
              ▶
            </span>
            <span className="vid-note">{note}</span>
          </button>
        )}
      </div>
    </figure>
  );
}
