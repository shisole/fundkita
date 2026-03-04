"use client";

import { ProgressBar } from "@/components/ui";

interface DonationSummaryProps {
  amount: number;
  currency: "PHP" | "USD";
  exchangeRate: number | null;
  processingFee: number;
  coverFee: boolean;
  tip: number;
  campaignTitle: string;
  campaignProgress: number;
  campaignGoal: number;
}

function formatPhp(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DonationSummary({
  amount,
  currency,
  exchangeRate,
  processingFee,
  coverFee,
  tip,
  campaignTitle,
  campaignProgress,
  campaignGoal,
}: DonationSummaryProps) {
  const amountPhp =
    currency === "USD" && exchangeRate ? Math.round(amount * exchangeRate * 100) / 100 : amount;

  const total = amountPhp + (coverFee ? processingFee : 0) + tip;
  const progressPercent = campaignGoal > 0 ? (campaignProgress / campaignGoal) * 100 : 0;

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Donation summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
          <span>Donation</span>
          <span>
            {currency === "USD" && exchangeRate
              ? `$${String(amount)} = ${formatPhp(amountPhp)}`
              : formatPhp(amount)}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
          <span>Processing fee {coverFee ? "(covered)" : ""}</span>
          <span>{coverFee ? formatPhp(processingFee) : "₱0.00"}</span>
        </div>

        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
          <span>Platform tip</span>
          <span>{formatPhp(tip)}</span>
        </div>

        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
            <span>Total</span>
            <span>{formatPhp(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-gray-200 pt-3 dark:border-gray-700">
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{campaignTitle}</p>
        <ProgressBar value={progressPercent} size="sm" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatPhp(campaignProgress)} raised of {formatPhp(campaignGoal)}
        </p>
      </div>
    </div>
  );
}
