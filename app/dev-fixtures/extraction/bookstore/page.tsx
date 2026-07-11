import type { Metadata } from "next";
import { ExtractionFixturePage } from "../_components/extraction-fixture-page";

export const metadata: Metadata = {
  title: "DEV ONLY BookStore Fixture",
  description:
    "Development-only extraction fixture for a successful BookStore candidate.",
  openGraph: {
    title: "Page One Bookstore",
    description: "An urban bookstore focused on books, magazines and reading events.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BookStore",
  name: "Page One Bookstore",
  description: "An urban bookstore focused on books, magazines and reading events.",
  url: "http://localhost:3000/dev-fixtures/extraction/bookstore",
  address: {
    "@type": "PostalAddress",
    streetAddress: "南京西路 999 号",
    addressLocality: "上海",
  },
};

export default function BookStoreFixturePage() {
  return (
    <ExtractionFixturePage
      title="Page One Bookstore"
      description="An urban bookstore focused on books, magazines and reading events."
      jsonLd={jsonLd}
      body={[
        "Page One Bookstore combines bookshelves, reading tables and small cultural events in a central city location.",
        "The page is intentionally simple so Step 11 can pick up a single shopping place from strong structured data.",
      ]}
    />
  );
}
