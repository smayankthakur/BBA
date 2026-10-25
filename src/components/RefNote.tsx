import { REF_NOTE } from "@/data/home";

/** One-line notice laid over a product photo: photos are references, every bracelet is made for the wearer. */
export default function RefNote({ className = "" }: { className?: string }) {
  return <span className={`ref-note ${className}`.trim()}>{REF_NOTE}</span>;
}
