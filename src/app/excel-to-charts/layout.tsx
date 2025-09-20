import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excel to Charts Generator – Auto Dashboard Creation | TidyDocs",
  description: "Convert Excel data to professional charts instantly. Bar charts, line graphs, pie charts, and scatter plots with smart data detection. Export to PDF.",
  alternates: {
    canonical: "/excel-to-charts",
  },
};

export default function ExcelToChartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

