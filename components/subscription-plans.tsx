import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "KES 0",
    blurb: "Start learning today with curated CBC-style quizzes.",
    features: [
      "Grade 1–12 subject previews",
      "Curated hardcoded question bank",
      "Basic progress tracking after sign-in",
      "Great for trying Elimu360 on any phone",
    ],
    cta: { label: "Create free account", href: "/sign-up" },
    highlight: false,
  },
  {
    name: "Premium",
    price: "Contact us",
    blurb: "Unlock AI-generated quizzes with freshness controls and deeper analytics.",
    features: [
      "AI-generated quizzes (gpt-4o-mini) with 30-day refresh cache",
      "More variety and faster iteration for exam seasons",
      "Stronger weak-area signals over time",
      "Priority roadmap features as we ship",
    ],
    cta: { label: "Upgrade after sign-in", href: "/sign-in" },
    highlight: true,
  },
];

export function SubscriptionPlans() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Simple plans for schools and families</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Elimu360 is designed for affordability: start free, then upgrade when you want AI-generated practice and premium
          workflows. Billing is managed in our database (not Clerk billing).
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${
              plan.highlight
                ? "border-emerald-300 bg-gradient-to-b from-emerald-50 to-white"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="text-sm font-semibold text-slate-900">{plan.price}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{plan.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
                plan.highlight
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              }`}
            >
              {plan.cta.label}
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Pricing for Premium will be finalized for Kenyan schools and parents (M-Pesa friendly checkout is the target).
        If you want a third “Schools” tier with teacher analytics and bulk seats, tell me and I’ll add it.
      </p>
    </section>
  );
}
