import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY ShoppingCenter Fixture",
  description:
    "Development-only extraction fixture for a successful ShoppingCenter candidate.",
  openGraph: {
    title: "Harbor Mall",
    description: "A waterfront mall with retail, cafés and weekend browsing.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ShoppingCenter",
  name: "Harbor Mall",
  description: "A waterfront mall with retail, cafés and weekend browsing.",
  url: "http://localhost:3000/dev-fixtures/extraction/shopping-center",
  address: {
    "@type": "PostalAddress",
    streetAddress: "海港路 188 号",
    addressLocality: "厦门",
  },
};

export default function ShoppingCenterFixturePage() {
  return (
    <ExtractionFixturePage
      title="Harbor Mall"
      description="A waterfront mall with retail, cafés and weekend browsing."
      jsonLd={jsonLd}
      body={[
        "Harbor Mall sits by the waterfront and brings together fashion retail, family-friendly browsing and all-day foot traffic.",
        "Visitors usually come here for seasonal pop-ups, relaxed browsing and a straightforward indoor mall experience.",
      ]}
    />
  );
}
