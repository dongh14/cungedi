import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Generic Place Missing Location Fixture",
  description:
    "Development-only extraction fixture for a generic Place fallback without reliable location evidence.",
  openGraph: {
    title: "Harbor Marker",
    description: "A placeholder marker with no reliable city or address evidence.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Place",
  name: "Harbor Marker",
  description: "A placeholder marker with no reliable city or address evidence.",
  url: "http://localhost:3000/dev-fixtures/extraction/generic-place-missing-location",
};

export default function GenericPlaceMissingLocationFixturePage() {
  return (
    <ExtractionFixturePage
      title="Harbor Marker"
      description="A placeholder marker with no reliable city or address evidence."
      jsonLd={jsonLd}
      body={[
        "This page intentionally omits any reliable city or precise location information.",
        "Step 3E should therefore fall back instead of creating an automatic 其他 draft.",
      ]}
    />
  );
}
