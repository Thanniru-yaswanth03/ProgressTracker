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
        className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 gap-1.5 font-medium"
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
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                  {step.example && (
                    <div className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono inline-block">
                      💡 Example: {step.example}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          {tip && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="leading-relaxed">
                <span className="font-semibold">Pro Tip: </span>
                {tip}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
