"use client";

import { useState } from "react";

import { CheckBadgeIcon, SpinnerIcon } from "@/components/icons";
import { Button, Input, Select } from "@/components/ui";
import { type PayoutMethod } from "@/lib/supabase/types";

interface WithdrawalFormProps {
  campaignId: string;
  campaignTitle: string;
  availableBalance: number;
}

const PAYOUT_METHOD_OPTIONS = [
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const PAYOUT_METHOD_VALUES: PayoutMethod[] = ["gcash", "maya", "bank_transfer"];

export default function WithdrawalForm({
  campaignId,
  campaignTitle,
  availableBalance,
}: WithdrawalFormProps) {
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("gcash");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = Number.parseFloat(amount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than zero");
      return;
    }

    if (parsedAmount > availableBalance) {
      setError("Amount exceeds available balance");
      return;
    }

    // Validate payout details based on method
    let payoutDetails: Record<string, string> = {};

    if (payoutMethod === "gcash" || payoutMethod === "maya") {
      if (!phone.trim()) {
        setError("Phone number is required");
        return;
      }
      payoutDetails = { phone: phone.trim() };
    } else {
      if (!bankName.trim()) {
        setError("Bank name is required");
        return;
      }
      if (!accountNumber.trim()) {
        setError("Account number is required");
        return;
      }
      if (!accountHolder.trim()) {
        setError("Account holder name is required");
        return;
      }
      payoutDetails = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_holder: accountHolder.trim(),
      };
    }

    setLoading(true);

    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        amount: parsedAmount,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
      }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const data: { error?: string } = await res.json();
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
        <CheckBadgeIcon className="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Withdrawal request submitted
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Your withdrawal request has been submitted for review. You will be notified once it is
            processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div>
        <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Request withdrawal
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Withdraw funds from <span className="font-medium">{campaignTitle}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        id="amount"
        label="Amount (PHP)"
        type="number"
        min="1"
        max={String(availableBalance)}
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <p className="!mt-1 text-sm text-gray-500 dark:text-gray-400">
        Available balance: <span className="font-medium">{availableBalance.toLocaleString()}</span>{" "}
        PHP
      </p>

      <Select
        id="payoutMethod"
        label="Payout method"
        value={payoutMethod}
        onChange={(e) => {
          const selected = PAYOUT_METHOD_VALUES.find((v) => v === e.target.value);
          if (selected) setPayoutMethod(selected);
        }}
        options={PAYOUT_METHOD_OPTIONS}
      />

      {payoutMethod === "gcash" || payoutMethod === "maya" ? (
        <Input
          id="phone"
          label="Phone number"
          type="tel"
          placeholder="09XX XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      ) : (
        <>
          <Input
            id="bankName"
            label="Bank name"
            type="text"
            placeholder="e.g. BDO, BPI, Metrobank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <Input
            id="accountNumber"
            label="Account number"
            type="text"
            placeholder="Enter account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <Input
            id="accountHolder"
            label="Account holder name"
            type="text"
            placeholder="Full name as registered"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            required
          />
        </>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : "Submit withdrawal request"}
      </Button>
    </form>
  );
}
