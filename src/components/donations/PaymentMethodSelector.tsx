"use client";

import { cn } from "@/lib/utils";

type PaymentMethodOption = "gcash" | "maya" | "gotyme" | "card" | "bank_transfer";

interface PaymentMethodSelectorProps {
  value: PaymentMethodOption | null;
  onChange: (method: PaymentMethodOption) => void;
}

const PAYMENT_METHODS: readonly { value: PaymentMethodOption; label: string; icon: string }[] = [
  { value: "gcash", label: "GCash", icon: "📱" },
  { value: "maya", label: "Maya", icon: "💳" },
  { value: "gotyme", label: "GoTyme", icon: "🏦" },
  { value: "card", label: "Debit/Credit Card", icon: "💲" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "🏧" },
];

export default function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Payment method
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
              value === method.value
                ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                : "border-gray-200 text-gray-600 hover:border-teal-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-teal-600",
            )}
          >
            <span className="text-xl">{method.icon}</span>
            <span>{method.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
