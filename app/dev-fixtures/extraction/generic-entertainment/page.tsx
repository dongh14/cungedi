import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Generic Entertainment Fixture",
  description:
    "Development-only extraction fixture for a successful generic EntertainmentBusiness candidate with blank subtype.",
  openGraph: {
    title: "Playfield Hub",
    description: "An indoor entertainment venue for casual group outings and relaxed evening plans.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EntertainmentBusiness",
  name: "Playfield Hub",
  description: "An indoor entertainment venue for casual group outings and relaxed evening plans.",
  url: "http://localhost:3000/dev-fixtures/extraction/generic-entertainment",
  address: {
    "@type": "PostalAddress",
    streetAddress: "中山路 66 号",
    addressLocality: "苏州",
  },
};

export default function GenericEntertainmentFixturePage() {
  return (
    <ExtractionFixturePage
      title="Playfield Hub"
      description="An indoor entertainment venue for casual group outings and relaxed evening plans."
      jsonLd={jsonLd}
      body={[
        "Playfield Hub is framed as a general entertainment venue rather than a narrowly typed activity category.",
        "This fixture validates that Step 11 can accept a strong EntertainmentBusiness candidate while leaving subtype blank when confidence stays low.",
      ]}
    />
  );
}
