import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "KES 0",
    blurb: "Start learning today with curated CBC-style quizzes.",
    features: [
      "Grade 1–12 subject quizzes",
      "Curated question bank",
      "Progress tracking after sign-in",
      "Family linking for parents",
    ],
    cta: { label: "Create free account", href: "/sign-up" },
    highlight: false,
  },
  {
    name: "Premium",
    price: "Contact us",
    blurb: "Unlock AI-generated quizzes with deeper practice and analytics.",
    features: [
      "AI-generated quizzes with periodic refresh",
      "More variety for revision and exam seasons",
      "Stronger weak-area signals over time",
      "Family access code for linked students",
    ],
    cta: { label: "Upgrade after sign-in", href: "/sign-in" },
    highlight: true,
  },
];

export function SubscriptionPlans() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
          Plans for schools and families
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Start free and move to Premium when you want expanded practice. Questions about pricing? Use the contact
          options in your account area after you sign in.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-6 lg:p-8 ${
              plan.highlight
                ? "border-emerald-300 bg-gradient-to-b from-emerald-50 to-white"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
              <p className="text-sm font-semibold text-slate-900">{plan.price}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600 lg:text-base">{plan.blurb}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700 lg:text-[15px]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={`mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold lg:text-base ${
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
    </section>
  );
}
