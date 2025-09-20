import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSV to PDF Converter – Professional Reports | TidyDocs",
  description: "Convert CSV files to polished PDF reports with automatic data cleaning, formatting, and professional tables. Free online tool for client-ready documents.",
  alternates: {
    canonical: "/csv-to-pdf",
  },
};

export default function CsvToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

