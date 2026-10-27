/** One-line notice laid over a product photo: photos are references, every bracelet is made for the wearer. */
export default function RefNote({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  return <span className={`ref-note ${className}`.trim()}>{text}</span>;
}
