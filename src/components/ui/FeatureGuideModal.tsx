"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { HelpCircle, Lightbulb } from "lucide-react";

export interface GuideStep {
  title: string;
  description: string;
  example?: string;
}

export interface FeatureGuideModalProps {
  featureName: string;
  title: string;
  subtitle: string;
  steps: GuideStep[];
  tip?: string;
  triggerButtonText?: string;
}

export function FeatureGuideModal({
  title,
  subtitle,
  steps,
  tip,
  triggerButtonText = "How It Works",
}: FeatureGuideModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs text-[var(--primary)] hover:bg-[var(--primary-soft)] gap-1.5 font-medium"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>{triggerButtonText}</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description={subtitle}
        maxWidth="lg"
      >
        <div className="space-y-4 py-2">
          {/* Guide Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[var(--primary-soft-border)]">
                  {index + 1}
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    {step.title}
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    {step.description}
                  </p>
                  {step.example && (
                    <div className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] font-mono inline-block">
                      💡 Example: {step.example}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          {tip && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="leading-relaxed">
                <span className="font-semibold">Pro Tip: </span>
                {tip}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
