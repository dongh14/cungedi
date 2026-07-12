import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Entertainment Directory Fixture",
  description:
    "Development-only extraction fixture for entertainment directory/list fallback validation.",
  openGraph: {
    title: "Venues | City Fun Guide",
    description: "Browse cinemas, bowling alleys and event venues across the district.",
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
      "@type": "MovieTheater",
      name: "Skyline Cinema",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Central Road 1",
        addressLocality: "上海",
      },
    },
    {
      "@type": "BowlingAlley",
      name: "Strike Lane",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Central Road 2",
        addressLocality: "上海",
      },
    },
  ],
};

export default function EntertainmentDirectoryFixturePage() {
  return (
    <ExtractionFixturePage
      title="Venues | City Fun Guide"
      description="Browse cinemas, bowling alleys and event venues across the district."
      jsonLd={jsonLd}
      body={[
        "Find a venue by neighborhood, activity type or tonight's plans before heading out.",
        "This page intentionally represents an entertainment directory with multiple destinations, so the extractor should fall back instead of generating a single-place draft.",
      ]}
    />
  );
}
