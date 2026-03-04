"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AlertIcon, SpinnerIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

import CurrencyToggle from "./CurrencyToggle";
import DonationSummary from "./DonationSummary";
import PaymentMethodSelector from "./PaymentMethodSelector";
import TipSelector from "./TipSelector";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentMethodOption = "gcash" | "maya" | "gotyme" | "card" | "bank_transfer";

interface DonationFormProps {
  campaign: {
    id: string;
    title: string;
    slug: string;
    goal_amount: number;
    amount_raised: number;
  };
  user: { full_name: string; email: string } | null;
  hasError?: boolean;
}

// ── Fee rates ─────────────────────────────────────────────────────────────────

const FEE_RATES: Record<PaymentMethodOption, number> = {
  gcash: 0.02,
  maya: 0.02,
  gotyme: 0.02,
  card: 0.035,
  bank_transfer: 0.01,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DonationForm({ campaign, user, hasError }: DonationFormProps) {
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"PHP" | "USD">("PHP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption | null>(null);
  const [tip, setTip] = useState(0);
  const [coverFee, setCoverFee] = useState(false);
  const [donorName, setDonorName] = useState(user?.full_name ?? "");
  const [donorEmail, setDonorEmail] = useState(user?.email ?? "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(hasError ? "Payment failed. Please try again." : "");

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Fetch exchange rate when USD is selected
  const fetchExchangeRate = useCallback(async () => {
    try {
      const res = await fetch("/api/exchange-rate");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const data: { usd_to_php?: number } = await res.json();
      setExchangeRate(data.usd_to_php ?? null);
    } catch {
      setExchangeRate(null);
    }
  }, []);

  useEffect(() => {
    if (currency === "USD") {
      void fetchExchangeRate();
    }
  }, [currency, fetchExchangeRate]);

  // Derived values
  const numericAmount = Number.parseFloat(amount) || 0;
  const amountPhp =
    currency === "USD" && exchangeRate
      ? Math.round(numericAmount * exchangeRate * 100) / 100
      : numericAmount;
  const processingFee = paymentMethod
    ? Math.round(amountPhp * FEE_RATES[paymentMethod] * 100) / 100
    : 0;
  const total = amountPhp + (coverFee ? processingFee : 0) + tip;

  // Submit handler
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");

    if (numericAmount <= 0) {
      setError("Please enter a valid donation amount");
      return;
    }
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }
    if (!donorName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!donorEmail.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.id,
          amount: numericAmount,
          currency,
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim(),
          is_anonymous: isAnonymous,
          platform_tip: tip,
          cover_fee: coverFee,
          payment_method: paymentMethod,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const body: Record<string, unknown> = await res.json();

      if (!res.ok) {
        const errMsg = typeof body.error === "string" ? body.error : "Something went wrong";
        setError(errMsg);
        setLoading(false);
        return;
      }

      const paymentUrl = body.paymentUrl;
      if (typeof paymentUrl === "string") {
        router.push(paymentUrl);
      } else {
        setError("No payment URL returned. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertIcon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Donor info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="donor-name"
            label="Full name"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Juan dela Cruz"
            required
          />
          <Input
            id="donor-email"
            label="Email"
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            placeholder="juan@email.com"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
          />
          Donate anonymously
        </label>
      </div>

      {/* Amount + currency */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <label
            htmlFor="donation-amount"
            className="block text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            Donation amount
          </label>
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {currency === "PHP" ? "₱" : "$"}
          </span>
          <input
            id="donation-amount"
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={currency === "PHP" ? "500" : "10"}
            required
            className="block w-full rounded-xl border border-gray-300 bg-white py-3 pl-8 pr-4 text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        {currency === "USD" && exchangeRate && numericAmount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ≈ ₱{amountPhp.toLocaleString("en-PH", { minimumFractionDigits: 2 })} at 1 USD ={" "}
            {String(exchangeRate)} PHP
          </p>
        )}
      </div>

      {/* Payment method */}
      <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

      {/* Processing fee toggle */}
      {paymentMethod && numericAmount > 0 && (
        <label
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors",
            coverFee
              ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
              : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400",
          )}
        >
          <input
            type="checkbox"
            checked={coverFee}
            onChange={(e) => setCoverFee(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
          />
          Cover the processing fee (₱
          {processingFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })})
        </label>
      )}

      {/* Tip selector */}
      <TipSelector donationAmount={amountPhp} tip={tip} onChange={setTip} />

      {/* Summary */}
      <DonationSummary
        amount={numericAmount}
        currency={currency}
        exchangeRate={exchangeRate}
        processingFee={processingFee}
        coverFee={coverFee}
        tip={tip}
        campaignTitle={campaign.title}
        campaignProgress={campaign.amount_raised}
        campaignGoal={campaign.goal_amount}
      />

      {/* Submit */}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? (
          <SpinnerIcon className="h-5 w-5 animate-spin" />
        ) : (
          `Donate ₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        )}
      </Button>
    </form>
  );
}
