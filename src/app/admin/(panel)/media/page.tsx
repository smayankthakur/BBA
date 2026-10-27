import type { Metadata } from "next";
import Notice from "@/components/admin/Notice";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { listMedia, mediaStorageReady } from "@/lib/server/media";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const items = await listMedia();
  return (
    <>
      <div className="ad-head">
        <h1>Media library</h1>
      </div>
      <Notice sp={sp} />
      <MediaLibrary
        ready={mediaStorageReady()}
        items={items.map((m) => ({
          ...m,
          created_at: new Date(m.created_at).toISOString(),
        }))}
      />
    </>
  );
}
