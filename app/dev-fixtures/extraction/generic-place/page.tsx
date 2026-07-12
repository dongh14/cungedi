import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Generic Place Fixture",
  description:
    "Development-only extraction fixture for a successful generic Place candidate.",
  openGraph: {
    title: "Harbor Service Center",
    description: "A single visitor support point near the ferry terminal.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Place",
  name: "Harbor Service Center",
  description: "A single visitor support point near the ferry terminal.",
  url: "http://localhost:3000/dev-fixtures/extraction/generic-place",
  address: {
    "@type": "PostalAddress",
    streetAddress: "海港路 10 号",
    addressLocality: "厦门",
  },
};

export default function GenericPlaceFixturePage() {
  return (
    <ExtractionFixturePage
      title="Harbor Service Center"
      description="A single visitor support point near the ferry terminal."
      jsonLd={jsonLd}
      body={[
        "Harbor Service Center focuses on route guidance, baggage help and simple arrival support for one specific point of interest.",
        "The page is intentionally category-neutral so Step 3E can accept it only as a conservative 其他 candidate.",
      ]}
    />
  );
}
