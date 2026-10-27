import LegalPage, { policyMetadata } from "@/components/LegalPage";

export function generateMetadata() {
  return policyMetadata("shipping", "/shipping", "How Bracelet By Ammit makes and ships your crystal bracelet, and how delivery works.");
}

export default function Page() {
  return <LegalPage id="shipping" crumb="Shipping" />;
}
