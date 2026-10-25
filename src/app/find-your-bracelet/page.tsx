import type { Metadata } from "next";
import Funnel from "@/components/funnel/Funnel";
import { BRACELETS } from "@/data/pages";
import { productPhotos } from "@/lib/server/photos";

export const metadata: Metadata = {
  title: "Find your bracelet: 60-second crystal reading",
  description:
    "Answer 7 quick questions to find your mulank, bhagyank and the crystal bracelet that suits your numbers. Every bracelet ₹1,199, strung by hand.",
  alternates: { canonical: "/find-your-bracelet" },
};

export default function FindYourBraceletPage() {
  const photos = Object.fromEntries(BRACELETS.map((b) => [b.slug, productPhotos(b.slug)]));
  return <Funnel photos={photos} />;
}
