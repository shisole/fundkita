const STATS = [
  { label: "Campaigns", value: "500+" },
  { label: "Donors", value: "10,000+" },
  { label: "Raised", value: "\u20B15M+" },
  { label: "Cities", value: "50+" },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Our athletes almost missed nationals because we couldn\u2019t afford the travel. Within a week, our FundKita campaign covered everything. The kids competed \u2014 and brought home medals.",
    name: "Coach Ricky Alvarado",
    role: "Palarong Pambansa Coach, Cebu",
  },
  {
    quote:
      "After the typhoon took our home, neighbors we\u2019d never met started donating. We raised enough to rebuild in two months. Filipinos truly show up for each other.",
    name: "Lorna Mae Villanueva",
    role: "Typhoon Survivor, Leyte",
  },
  {
    quote:
      "I never thought strangers would help pay for my daughter\u2019s tuition. She\u2019s now in her second year of college, and it all started with a single shared post.",
    name: "Renato Delos Santos",
    role: "Parent, Davao City",
  },
] as const;

export default function SocialProof() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-bold text-teal-600 dark:text-teal-400 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <blockquote className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
