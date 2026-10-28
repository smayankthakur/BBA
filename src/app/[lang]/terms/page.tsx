import LegalPage, { policyMetadata } from "@/components/LegalPage";
import { pageLang } from "@/lib/server/lang";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P) {
  await pageLang(params);
  return policyMetadata("terms", "/terms");
}

export default async function Page({ params }: P) {
  await pageLang(params);
  return <LegalPage id="terms" />;
}
