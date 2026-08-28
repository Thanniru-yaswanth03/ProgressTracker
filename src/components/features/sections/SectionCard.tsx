"use client";

import * as React from "react";
import { SectionDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { Edit2, ExternalLink, Folder, Trash2 } from "lucide-react";
import Link from "next/link";

export interface SectionCardProps {
  section: SectionDTO;
  onEdit: (section: SectionDTO) => void;
  onDelete: (section: SectionDTO) => void;
}

export function SectionCard({ section, onEdit, onDelete }: SectionCardProps) {
  const formattedDate = new Date(section.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="group flex flex-col justify-between transition-all duration-200 p-5 relative overflow-hidden">
      {/* Top Color Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-opacity"
        style={{ backgroundColor: section.color || "var(--primary)" }}
      />

      <div>
        {/* Header Icon + Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{
                backgroundColor: `${section.color || "#ea580c"}20`,
                borderColor: `${section.color || "#ea580c"}40`,
                borderWidth: "1px",
              }}
            >
              <Folder
                className="w-4 h-4"
                style={{ color: section.color || "var(--primary)" }}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] truncate transition-colors">
                {section.name}
              </h3>
              <p className="text-[10px] text-[var(--muted-foreground)]">Created {formattedDate}</p>
            </div>
          </div>

          {/* Edit / Delete actions */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(section)}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Rename / Edit"
              aria-label={`Edit ${section.name}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(section)}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete Section"
              aria-label={`Delete ${section.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 min-h-[32px] mb-4 leading-relaxed">
          {section.description || "No description provided."}
        </p>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border"
          style={{
            color: section.color || "var(--primary)",
            backgroundColor: `${section.color || "#ea580c"}15`,
            borderColor: `${section.color || "#ea580c"}30`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: section.color || "var(--primary)" }}
          />
          Active Domain
        </span>

        <Link
          href={`/sections/${section.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline transition-colors"
        >
          <span>Workspace</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}
