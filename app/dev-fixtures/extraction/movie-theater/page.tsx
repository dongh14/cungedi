import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY MovieTheater Fixture",
  description:
    "Development-only extraction fixture for a successful MovieTheater candidate.",
  openGraph: {
    title: "Skyline Cinema",
    description: "A neighborhood movie theater for new releases and weekend screenings.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MovieTheater",
  name: "Skyline Cinema",
  description: "A neighborhood movie theater for new releases and weekend screenings.",
  url: "http://localhost:3000/dev-fixtures/extraction/movie-theater",
  address: {
    "@type": "PostalAddress",
    streetAddress: "长宁路 88 号",
    addressLocality: "上海",
  },
};

export default function MovieTheaterFixturePage() {
  return (
    <ExtractionFixturePage
      title="Skyline Cinema"
      description="A neighborhood movie theater for new releases and weekend screenings."
      jsonLd={jsonLd}
      body={[
        "Skyline Cinema focuses on daily screenings, a compact lobby and a straightforward indoor movie-going experience.",
        "The page is intentionally simple so Step 11 can validate a single玩乐地点 candidate from strong structured data.",
      ]}
    />
  );
}
