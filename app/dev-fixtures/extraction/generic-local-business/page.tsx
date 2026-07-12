import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Generic LocalBusiness Fixture",
  description:
    "Development-only extraction fixture for a successful generic LocalBusiness candidate.",
  openGraph: {
    title: "North Pier Visitor Hub",
    description: "Arrival assistance and route guidance at one specific harbor point.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "North Pier Visitor Hub",
  description: "Arrival assistance and route guidance at one specific harbor point.",
  url: "http://localhost:3000/dev-fixtures/extraction/generic-local-business",
  address: {
    "@type": "PostalAddress",
    streetAddress: "海滨路 20 号",
    addressLocality: "青岛",
  },
};

export default function GenericLocalBusinessFixturePage() {
  return (
    <ExtractionFixturePage
      title="North Pier Visitor Hub"
      description="Arrival assistance and route guidance at one specific harbor point."
      jsonLd={jsonLd}
      body={[
        "North Pier Visitor Hub provides lockers, help-desk service and printed route information for one arrival area.",
        "The copy avoids shopping, dining, lodging and entertainment labels so the extractor keeps this in the conservative 其他 path.",
      ]}
    />
  );
}
