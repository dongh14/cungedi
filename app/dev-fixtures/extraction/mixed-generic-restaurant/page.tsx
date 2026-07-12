import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Mixed Generic Restaurant Fixture",
  description:
    "Development-only extraction fixture for mixed generic-place and restaurant evidence fallback.",
  openGraph: {
    title: "Harbor Hall & Noodle Bar",
    description: "A hall with an attached restaurant and mixed structured data.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Place",
    name: "Harbor Hall",
    address: {
      "@type": "PostalAddress",
      streetAddress: "港湾路 1 号",
      addressLocality: "上海",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Noodle Bar",
    address: {
      "@type": "PostalAddress",
      streetAddress: "港湾路 1 号",
      addressLocality: "上海",
    },
  },
];

export default function MixedGenericRestaurantFixturePage() {
  return (
    <ExtractionFixturePage
      title="Harbor Hall & Noodle Bar"
      description="A hall with an attached restaurant and mixed structured data."
      jsonLd={jsonLd}
      body={[
        "The page intentionally mixes a generic place record with a restaurant record.",
        "Step 3E should fall back rather than silently picking 其他 or 美食.",
      ]}
    />
  );
}
