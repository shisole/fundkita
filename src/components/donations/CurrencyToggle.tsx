"use client";

import { cn } from "@/lib/utils";

interface CurrencyToggleProps {
  currency: "PHP" | "USD";
  onChange: (currency: "PHP" | "USD") => void;
}

const CURRENCIES: readonly { value: "PHP" | "USD"; label: string; symbol: string }[] = [
  { value: "PHP", label: "PHP", symbol: "₱" },
  { value: "USD", label: "USD", symbol: "$" },
];

export default function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex rounded-xl border border-gray-300 dark:border-gray-700">
      {CURRENCIES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors first:rounded-l-xl last:rounded-r-xl",
            currency === c.value
              ? "bg-teal-500 text-white"
              : "text-gray-600 hover:bg-teal-50 dark:text-gray-400 dark:hover:bg-teal-950",
          )}
        >
          {c.symbol} {c.label}
        </button>
      ))}
    </div>
  );
}
