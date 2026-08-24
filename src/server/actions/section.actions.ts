"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { sectionService } from "@/server/services/section.service";
import { ActionResponse, SectionDTO, CreateSectionInput, UpdateSectionInput } from "@/types";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Server action to create a new section.
 */
export async function createSectionAction(
  data: CreateSectionInput
): Promise<ActionResponse<SectionDTO>> {
  try {
    const user = await requireUser();
    const section = await sectionService.createSection(user.id, data);

    revalidatePath("/sections");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: section,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return {
        success: false,
        error: "Validation failed. Please check form fields.",
        errors: fieldErrors,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("createSectionAction error:", error);
    return {
      success: false,
      error: "Failed to create section. Please try again.",
    };
  }
}

/**
 * Server action to update/rename a section.
 */
export async function updateSectionAction(
  sectionId: string,
  data: UpdateSectionInput
): Promise<ActionResponse<SectionDTO>> {
  try {
    const user = await requireUser();
    const section = await sectionService.updateSection(sectionId, user.id, data);

    revalidatePath("/sections");
    revalidatePath(`/sections/${sectionId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: section,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return {
        success: false,
        error: "Validation failed. Please check form fields.",
        errors: fieldErrors,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Section not found.",
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("updateSectionAction error:", error);
    return {
      success: false,
      error: "Failed to update section. Please try again.",
    };
  }
}

/**
 * Server action to delete a section.
 */
export async function deleteSectionAction(
  sectionId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await requireUser();
    await sectionService.deleteSection(sectionId, user.id);

    revalidatePath("/sections");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Section not found.",
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("deleteSectionAction error:", error);
    return {
      success: false,
      error: "Failed to delete section. Please try again.",
    };
  }
}
