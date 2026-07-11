import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Shopping Directory Fixture",
  description:
    "Development-only extraction fixture for shopping directory/list fallback validation.",
  openGraph: {
    title: "Stores | Harbor Mall",
    description: "Browse brands, stores and shopping categories across the mall.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Store",
      name: "North Wing Store",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Mall Road 1",
        addressLocality: "厦门",
      },
    },
    {
      "@type": "BookStore",
      name: "Books Plaza",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Mall Road 2",
        addressLocality: "厦门",
      },
    },
  ],
};

export default function ShoppingDirectoryFixturePage() {
  return (
    <ExtractionFixturePage
      title="Stores | Harbor Mall"
      description="Browse brands, stores and shopping categories across the mall."
      jsonLd={jsonLd}
      body={[
        "Find a store by floor, brand or shopping category before your next visit.",
        "This page intentionally represents a directory with multiple shopping destinations, so the extractor should fall back instead of generating a single-place draft.",
      ]}
    />
  );
}
