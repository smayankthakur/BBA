"use client";

import { useContext, useState } from "react";
import Image from "next/image";
import RefNote from "./RefNote";
import { LangCtx } from "./LangProvider";
import { UI_EN } from "@/lib/i18n/ui.en";

/** Reel id from an Instagram reel/post link, or null. */
export const reelId = (url: string) => /instagram\.com\/(?:reel|reels|p)\/([\w-]{5,40})/.exec(url)?.[1] ?? null;

/**
 * Click-to-play Instagram reel with a photo cover. Nothing loads from
 * Instagram until the visitor presses play. Instagram's embed is cropped so
 * only the video shows, filling the frame (no header, footer or scrollbar).
 */
export default function InstagramReel({ url, title, note, cover, refNote }: { url: string; title: string; note: string; cover?: string; refNote?: string }) {
  const [play, setPlay] = useState(false);
  const c = (useContext(LangCtx)?.ui ?? UI_EN).common;
  const id = reelId(url);
  if (!id) return null;
  return (
    <figure className="vid reel">
      <div className="vid-frame reel-frame">
        {play ? (
          <iframe
            className="reel-iframe"
            src={`https://www.instagram.com/reel/${id}/embed/`}
            title={title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            scrolling="no"
            loading="lazy"
          />
        ) : (
          <button type="button" className="vid-poster reel-poster" onClick={() => setPlay(true)} aria-label={c.playVideo.replace("{title}", title)}>
            {cover && <Image src={cover} alt="" fill sizes="(max-width: 760px) 70vw, 300px" className="reel-cover" />}
            <span className="reel-shade" aria-hidden="true" />
            <span className="vid-play" aria-hidden="true">
              ▶
            </span>
            <span className="reel-caption">
              <span className="vid-title">{title}</span>
              <span className="vid-note">{note}</span>
            </span>
          </button>
        )}
        {!play && refNote && <RefNote text={refNote} />}
      </div>
    </figure>
  );
}
