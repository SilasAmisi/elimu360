import Link from "next/link";

const plans = [
  {
    name: "Single Child",
    price: "KES 300 / month",
    blurb: "Best for one learner at home with steady weekly practice.",
    features: [
      "One active student profile",
      "Grade-based quizzes and reports",
      "Parent/guardian dashboard access",
      "Kenya@60 family assessment pack",
    ],
    cta: { label: "Choose single-child plan", href: "/sign-up" },
    highlight: false,
  },
  {
    name: "Family (3 Children)",
    price: "KES 800 / month",
    blurb: "One parent account covering up to three children in one plan.",
    features: [
      "Up to 3 linked student profiles",
      "Shared family code for student access",
      "Progress summary across all children",
      "Good for siblings in different grades",
    ],
    cta: { label: "Choose family plan", href: "/sign-up" },
    highlight: true,
  },
  {
    name: "Teachers / Schools",
    price: "From KES 5,000 / month",
    blurb: "For classrooms and schools that need assignment and analytics tools.",
    features: [
      "Teacher dashboard and class codes",
      "Assignment workflow and class tracking",
      "Multi-student access management",
      "Onboarding support for school teams",
    ],
    cta: { label: "Contact for school setup", href: "/sign-in" },
    highlight: false,
  },
  {
    name: "One-Time Exam Pass",
    price: "KES 120 / pass",
    blurb: "Single-use access for focused exam revision sessions.",
    features: [
      "One short exam pack redemption",
      "Timed practice with instant score",
      "Useful for holiday or mock prep",
      "No recurring monthly commitment",
    ],
    cta: { label: "Get exam pass", href: "/sign-up" },
    highlight: false,
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
          Choose the model that fits your learning setup: one child, a family bundle, school usage, or one-time exam
          practice.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
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
