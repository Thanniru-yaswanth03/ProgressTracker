"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { habitService } from "@/server/services/habit.service";
import {
  ActionResponse,
  HabitDTO,
  CreateHabitInput,
  UpdateHabitInput,
} from "@/types";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Server action to create a new habit.
 */
export async function createHabitAction(
  data: CreateHabitInput
): Promise<ActionResponse<HabitDTO>> {
  try {
    const user = await requireUser();
    const habit = await habitService.createHabit(user.id, data);

    revalidatePath("/habits");
    revalidatePath("/dashboard");
    if (habit.sectionId) {
      revalidatePath(`/sections/${habit.sectionId}`);
    }

    return {
      success: true,
      data: habit,
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
        error: "Validation failed. Please check habit inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("createHabitAction error:", error);
    return {
      success: false,
      error: "Failed to create habit. Please try again.",
    };
  }
}

/**
 * Server action to update an existing habit.
 */
export async function updateHabitAction(
  habitId: string,
  data: UpdateHabitInput
): Promise<ActionResponse<HabitDTO>> {
  try {
    const user = await requireUser();
    const habit = await habitService.updateHabit(habitId, user.id, data);

    revalidatePath("/habits");
    revalidatePath("/dashboard");
    if (habit.sectionId) {
      revalidatePath(`/sections/${habit.sectionId}`);
    }

    return {
      success: true,
      data: habit,
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
        error: "Validation failed. Please check habit inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Habit not found.",
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("updateHabitAction error:", error);
    return {
      success: false,
      error: "Failed to update habit. Please try again.",
    };
  }
}

/**
 * Server action to toggle completion of a habit for a date.
 */
export async function toggleHabitLogAction(
  habitId: string,
  dateStr?: string
): Promise<ActionResponse<{ habit: HabitDTO; completed: boolean }>> {
  try {
    const user = await requireUser();
    const result = await habitService.toggleHabitLog(habitId, user.id, dateStr);

    revalidatePath("/habits");
    revalidatePath("/dashboard");
    if (result.habit.sectionId) {
      revalidatePath(`/sections/${result.habit.sectionId}`);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Habit not found.",
      };
    }

    console.error("toggleHabitLogAction error:", error);
    return {
      success: false,
      error: "Failed to toggle habit check-in.",
    };
  }
}

/**
 * Server action to archive/unarchive a habit.
 */
export async function archiveHabitAction(
  habitId: string,
  archived: boolean
): Promise<ActionResponse<HabitDTO>> {
  try {
    const user = await requireUser();
    const habit = await habitService.archiveHabit(habitId, user.id, archived);

    revalidatePath("/habits");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: habit,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Habit not found.",
      };
    }

    console.error("archiveHabitAction error:", error);
    return {
      success: false,
      error: "Failed to update archive status.",
    };
  }
}

/**
 * Server action to delete a habit.
 */
export async function deleteHabitAction(
  habitId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await requireUser();
    await habitService.deleteHabit(habitId, user.id);

    revalidatePath("/habits");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Habit not found.",
      };
    }

    console.error("deleteHabitAction error:", error);
    return {
      success: false,
      error: "Failed to delete habit.",
    };
  }
}
