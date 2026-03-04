import { CampaignIcon, HeartIcon, ShareIcon } from "@/components/icons";

const STEPS = [
  {
    number: 1,
    title: "Start a Campaign",
    description:
      "Set up your fundraiser in minutes. Tell your story, set a goal, and choose your category.",
    icon: CampaignIcon,
  },
  {
    number: 2,
    title: "Share Your Story",
    description:
      "Spread the word through social media, messaging apps, and your community. Every share counts.",
    icon: ShareIcon,
  },
  {
    number: 3,
    title: "Receive Support",
    description:
      "Donations flow in via GCash, Maya, bank transfer, and more. Withdraw funds when you need them.",
    icon: HeartIcon,
  },
] as const;

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 px-4 py-16 dark:bg-gray-900/50 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Simple &amp; Transparent
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            How It Works
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              {/* Numbered circle + icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
                <step.icon className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="mt-3 inline-block rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-teal-500">
                {step.number}
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
