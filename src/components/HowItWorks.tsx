import { getContent } from "@/lib/server/content";

export default async function HowItWorks({ title }: { title?: string }) {
  const c = await getContent("shared");
  return (
    <section className="how" aria-labelledby="how-title">
      <div className="how-inner">
        <h2 id="how-title" className="h2">
          {title || c.howTitle}
        </h2>
        <ol className="how-steps" tabIndex={0} aria-label="Steps">
          {c.howSteps.map((s, i) => (
            <li key={`${i}-${s.title}`}>
              <span className="how-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
