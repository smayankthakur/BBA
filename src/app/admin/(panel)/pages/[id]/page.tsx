import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Notice from "@/components/admin/Notice";
import ContentForm from "@/components/admin/ContentForm";
import { pageDef } from "@/lib/content/fields";
import { contentUpdatedAt, getContent } from "@/lib/server/content";
import { requireAdmin, roleAtLeast } from "@/lib/server/auth";
import { resetContentAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const def = pageDef(id);
  if (!def) notFound();
  const user = await requireAdmin();
  if (def.id === "settings" && !roleAtLeast(user.role, "admin"))
    redirect("/admin?denied=1");
  const [data, updated] = await Promise.all([
    getContent(def.id),
    contentUpdatedAt(),
  ]);
  const isAdmin = roleAtLeast(user.role, "admin");

  return (
    <>
      <div className="ad-head">
        <h1>{def.title}</h1>
      </div>
      <p className="ad-sub">
        <Link href="/admin/pages">← All pages</Link>
      </p>
      <Notice sp={sp} />
      <ContentForm
        key={String(updated[def.id] ?? "default")}
        def={def}
        initial={data as Record<string, unknown>}
      />
      {isAdmin && updated[def.id] && (
        <details className="ad-box" style={{ maxWidth: 640 }}>
          <summary>Go back to the original text</summary>
          <form action={resetContentAction} className="ad-box-body">
            <input type="hidden" name="id" value={def.id} />
            <p>
              This replaces everything on this screen with the text the site
              launched with. It can&apos;t be undone.
            </p>
            <label className="ad-check">
              <input type="checkbox" name="confirm" value="yes" required />
              <span>Yes, reset {def.title}</span>
            </label>
            <div>
              <button className="ad-btn is-danger" type="submit">
                Reset
              </button>
            </div>
          </form>
        </details>
      )}
    </>
  );
}
