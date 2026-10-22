import Image from "next/image";

/**
 * Brand intro: "Bracelet By Ammit" folds into "BBA", the wordmark and emblem
 * fade in, then the lapis panel wipes upward (≈3.8s total, CSS only).
 * Hidden entirely for users who prefer reduced motion.
 */
export default function Loader() {
  return (
    <div className="loader" aria-hidden="true">
      <div className="lgo">
        <Image className="lemb" src="/brand/emblem.png" alt="" width={570} height={630} priority />
        <div className="lword">
          <span className="ltext">
            <span className="ini">B</span>
            <span className="fade">racelet </span>
            <span className="ini">B</span>
            <span className="fade">y </span>
            <span className="ini">A</span>
            <span className="fade">mmit</span>
          </span>
          <Image className="lwm" src="/brand/wordmark.png" alt="" width={460} height={213} priority />
        </div>
      </div>
    </div>
  );
}
