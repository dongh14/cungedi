import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Generic Directory Fixture",
  description:
    "Development-only extraction fixture for a generic directory fallback.",
  openGraph: {
    title: "Service Center Directory",
    description: "Browse all service centers and visitor hubs across the city.",
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
    name: "East Service Center",
    address: {
      "@type": "PostalAddress",
      streetAddress: "东一路 8 号",
      addressLocality: "上海",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Place",
    name: "West Service Center",
    address: {
      "@type": "PostalAddress",
      streetAddress: "西一路 18 号",
      addressLocality: "上海",
    },
  },
];

export default function GenericDirectoryFixturePage() {
  return (
    <ExtractionFixturePage
      title="Service Center Directory"
      description="Browse all service centers and visitor hubs across the city."
      jsonLd={jsonLd}
      body={[
        "All locations",
        "East Service Center and West Service Center are shown together on purpose so the extractor treats this as a directory page.",
      ]}
    />
  );
}
