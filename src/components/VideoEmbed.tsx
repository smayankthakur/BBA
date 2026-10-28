"use client";

import { useState } from "react";
import Medallion from "./Medallion";
import type { Video } from "@/data/videos";
import { useContext } from "react";
import { LangCtx } from "./LangProvider";
import { UI_EN } from "@/lib/i18n/ui.en";

/**
 * Click-to-play YouTube Short. Nothing loads from YouTube until the visitor
 * presses play; then the privacy-enhanced (nocookie) player is used.
 */
export default function VideoEmbed({ video, caption }: { video: Video; caption?: string }) {
  const [play, setPlay] = useState(false);
  const c = (useContext(LangCtx)?.ui ?? UI_EN).common;
  return (
    <figure className="vid">
      <div className="vid-frame">
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button type="button" className="vid-poster" onClick={() => setPlay(true)} aria-label={c.playVideo.replace("{title}", video.title)}>
            <Medallion width={40} height={44} />
            <span className="vid-title">{video.title}</span>
            <span className="vid-play" aria-hidden="true">
              ▶
            </span>
            <span className="vid-note">{c.fromYouTube}</span>
          </button>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
