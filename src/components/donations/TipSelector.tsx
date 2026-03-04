"use client";

import { useState } from "react";

import { Input } from "@/components/ui";
import { getSuggestedTip } from "@/lib/constants/tip-suggestions";
import { cn } from "@/lib/utils";

interface TipSelectorProps {
  donationAmount: number;
  tip: number;
  onChange: (tip: number) => void;
}

type TipMode = "none" | "suggested" | "custom";

export default function TipSelector({ donationAmount, tip, onChange }: TipSelectorProps) {
  const [mode, setMode] = useState<TipMode>("none");
  const suggestedAmount = getSuggestedTip(donationAmount);

  function handleModeChange(newMode: TipMode) {
    setMode(newMode);
    if (newMode === "none") {
      onChange(0);
    } else if (newMode === "suggested") {
      onChange(suggestedAmount);
    }
  }

  function handleCustomChange(value: string) {
    const parsed = Number.parseFloat(value);
    onChange(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
  }

  const buttons: readonly { mode: TipMode; label: string }[] = [
    { mode: "none", label: "₱0" },
    { mode: "suggested", label: `₱${String(suggestedAmount)}` },
    { mode: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Support FundKita (optional)
      </label>
      <div className="flex gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.mode}
            type="button"
            onClick={() => handleModeChange(btn.mode)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              mode === btn.mode
                ? "bg-teal-500 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-teal-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-teal-950",
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {mode === "custom" && (
        <Input
          id="custom-tip"
          type="number"
          min="0"
          step="1"
          placeholder="Enter tip amount (PHP)"
          value={tip === 0 ? "" : String(tip)}
          onChange={(e) => handleCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}
