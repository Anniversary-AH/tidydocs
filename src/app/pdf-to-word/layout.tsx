import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to Word Converter – Editable Documents | TidyDocs",
  description: "Convert PDF files to editable Word documents while preserving formatting, tables, and layout. Free online PDF to DOCX converter with smart text recognition.",
  alternates: {
    canonical: "/pdf-to-word",
  },
};

export default function PdfToWordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

