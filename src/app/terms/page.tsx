import LegalPage, { policyMetadata } from "@/components/LegalPage";

export function generateMetadata() {
  return policyMetadata("terms", "/terms", "The terms for using this website and ordering a Bracelet By Ammit crystal bracelet.");
}

export default function Page() {
  return <LegalPage id="terms" crumb="Terms" />;
}
