import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY Event Schedule Fixture",
  description:
    "Development-only extraction fixture for event schedule fallback validation.",
  openGraph: {
    title: "Show Schedule | Harbor Stage",
    description: "Check this week's performances, schedule and upcoming events at the venue.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EventVenue",
  name: "Harbor Stage",
  description: "Check this week's performances, schedule and upcoming events at the venue.",
  url: "http://localhost:3000/dev-fixtures/extraction/event-schedule",
  address: {
    "@type": "PostalAddress",
    streetAddress: "海边路 20 号",
    addressLocality: "青岛",
  },
};

export default function EventScheduleFixturePage() {
  return (
    <ExtractionFixturePage
      title="Show Schedule | Harbor Stage"
      description="Check this week's performances, schedule and upcoming events at the venue."
      jsonLd={jsonLd}
      body={[
        "View the latest lineup, show schedule and upcoming events before planning your visit.",
        "This page intentionally looks like an events calendar, so the extractor should fall back instead of accepting it as a clean single-place entertainment profile.",
      ]}
    />
  );
}
