import type { Metadata } from "next";
import ReadingCardTool from "@/components/ReadingCardTool";

export const metadata: Metadata = { title: "Reading card (staff tool)" };

export default function Page() {
  return <ReadingCardTool />;
}
