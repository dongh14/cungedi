import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Mixed Shopping + Restaurant Fixture",
  description:
    "Development-only extraction fixture for mixed-category fallback validation.",
  openGraph: {
    title: "City Center Complex",
    description: "A mixed complex with a shopping center and a restaurant in the same source.",
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
      "@type": "ShoppingCenter",
      name: "City Center Mall",
    },
    {
      "@type": "Restaurant",
      name: "City Center Kitchen",
    },
  ],
};

export default function MixedShoppingRestaurantFixturePage() {
  return (
    <ExtractionFixturePage
      title="City Center Complex"
      description="A mixed complex with a shopping center and a restaurant in the same source."
      jsonLd={jsonLd}
      body={[
        "This source intentionally exposes strong shopping and restaurant structured data together.",
        "It exists to validate that Step 11 falls back for mixed-category ambiguity instead of silently defaulting to one category.",
      ]}
    />
  );
}
