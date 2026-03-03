import Link from "next/link";

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <span className="font-heading text-lg font-bold text-teal-600 dark:text-teal-400">
              FundKita
            </span>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fund for Us. Crowdfunding for the Philippines.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 text-center dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} FundKita. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
