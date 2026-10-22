import { HOW_IT_WORKS } from "@/data/pages";

export default function HowItWorks({ title = "How your bracelet is made" }: { title?: string }) {
  return (
    <section className="how" aria-labelledby="how-title">
      <div className="how-inner">
        <h2 id="how-title" className="h2">
          {title}
        </h2>
        <ol className="how-steps">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title}>
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
