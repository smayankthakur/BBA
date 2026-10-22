import Image from "next/image";

type Props = {
  /** Rendered size of the emblem inside the lapis circle */
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/** Lapis circle holding the BBA emblem, used in header, hero and note card. */
export default function Medallion({ width, height, className = "", priority }: Props) {
  return (
    <span className={`medallion ${className}`.trim()} aria-hidden="true">
      <Image src="/brand/emblem.png" alt="" width={width} height={height} priority={priority} />
    </span>
  );
}
