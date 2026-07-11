import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Generic Store Fixture",
  description:
    "Development-only extraction fixture for a successful generic Store candidate with blank subtype.",
  openGraph: {
    title: "Studio Market",
    description: "A neighborhood retail space with a compact storefront and daily essentials.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Studio Market",
  description: "A neighborhood retail space with a compact storefront and daily essentials.",
  url: "http://localhost:3000/dev-fixtures/extraction/generic-store",
  address: {
    "@type": "PostalAddress",
    streetAddress: "复兴中路 18 号",
    addressLocality: "上海",
  },
};

export default function GenericStoreFixturePage() {
  return (
    <ExtractionFixturePage
      title="Studio Market"
      description="A neighborhood retail space with a compact storefront and daily essentials."
      jsonLd={jsonLd}
      body={[
        "Studio Market is described as a general retail space rather than a narrowly typed store category.",
        "This fixture is meant to validate that Step 11 can accept a strong Store candidate while leaving subtype blank when confidence stays low.",
      ]}
    />
  );
}
