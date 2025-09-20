import Link from "next/link";

type FeatureCard = {
  emoji: string;
  emojiLabel: string;
  title: string;
  tagline: string;
  href: string;
};

const features: FeatureCard[] = [
  {
    emoji: "📄",
    emojiLabel: "Document",
    title: "CSV → PDF",
    tagline: "Polished, branded reports.",
    href: "/csv-to-pdf",
  },
  {
    emoji: "🧩",
    emojiLabel: "Conversion",
    title: "PDF → Word/Excel",
    tagline: "Editable conversions in one click.",
    href: "/pdf-to-word",
  },
  {
    emoji: "📊",
    emojiLabel: "Charts",
    title: "Excel → Charts",
    tagline: "Auto dashboards from your data.",
    href: "/excel-to-charts",
  },
];

const Home = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Make messy files client-ready in seconds</h1>
        <p className="mt-3 text-neutral-700">Free, fast tools for cleaning and converting everyday documents.</p>
      </div>
      {/* Hero Tiles Preview */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <div className="aspect-[2/1] bg-neutral-100 rounded-xl flex items-center justify-center overflow-hidden">
          <img 
            src="/hero-tiles.svg" 
            alt="TidyDocs tools preview" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span role="img" aria-label={f.emojiLabel} className="text-2xl">{f.emoji}</span>
              <h2 className="text-lg font-semibold tracking-tight">{f.title}</h2>
            </div>
            <p className="mt-2 text-neutral-700">{f.tagline}</p>
            <div className="mt-4">
              <Link
                href={f.href}
                aria-label={`${f.title} – ${f.tagline}`}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
              >
                Open tool
              </Link>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-neutral-600">No uploads stored. Files processed in your browser or short-lived memory.</p>
    </section>
  );
};

export default Home;
