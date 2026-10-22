import type { Metadata } from "next";
import Funnel from "@/components/funnel/Funnel";

export const metadata: Metadata = {
  title: "Find your bracelet: 60-second crystal reading",
  description:
    "Answer 7 quick questions to find your mulank, bhagyank and the crystal bracelet that suits your numbers. Every bracelet ₹1,199, strung by hand.",
  alternates: { canonical: "/find-your-bracelet" },
};

export default function FindYourBraceletPage() {
  return <Funnel />;
}
