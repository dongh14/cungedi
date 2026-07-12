import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Mixed Entertainment + Restaurant Fixture",
  description:
    "Development-only extraction fixture for mixed-category entertainment fallback validation.",
  openGraph: {
    title: "City Night Complex",
    description: "A mixed complex with a nightlife venue and a restaurant in the same source.",
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
      "@type": "NightClub",
      name: "City Night Club",
    },
    {
      "@type": "Restaurant",
      name: "Late Supper Kitchen",
    },
  ],
};

export default function MixedEntertainmentRestaurantFixturePage() {
  return (
    <ExtractionFixturePage
      title="City Night Complex"
      description="A mixed complex with a nightlife venue and a restaurant in the same source."
      jsonLd={jsonLd}
      body={[
        "This source intentionally exposes strong entertainment and restaurant structured data together.",
        "It exists to validate that Step 11 falls back for mixed-category ambiguity instead of silently defaulting to one category.",
      ]}
    />
  );
}
