export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12" aria-labelledby="contact-heading">
      <h1 id="contact-heading" className="text-2xl font-bold tracking-tight">Contact</h1>
      <div className="mt-4 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <p className="text-neutral-700">Email us at <a href="mailto:hello@amber-field.tools" className="underline underline-offset-4">hello@amber-field.tools</a>.</p>
      </div>
    </section>
  );
}


