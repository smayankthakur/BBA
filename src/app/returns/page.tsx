import LegalPage, { policyMetadata } from "@/components/LegalPage";

export function generateMetadata() {
  return policyMetadata("returns", "/returns", "Returns, exchanges and restringing for Bracelet By Ammit crystal bracelets.");
}

export default function Page() {
  return <LegalPage id="returns" crumb="Returns" />;
}
