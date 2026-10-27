import LegalPage, { policyMetadata } from "@/components/LegalPage";

export function generateMetadata() {
  return policyMetadata("privacy", "/privacy", "How Bracelet By Ammit collects, uses and protects your personal data.");
}

export default function Page() {
  return <LegalPage id="privacy" crumb="Privacy" />;
}
