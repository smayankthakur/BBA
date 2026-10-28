import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import ReadingCardTool from "@/components/ReadingCardTool";

type Params = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { title: "Reading card (staff tool)" };

export default async function Page({ params }: Params) {
  await pageLang(params);
  return <ReadingCardTool />;
}
