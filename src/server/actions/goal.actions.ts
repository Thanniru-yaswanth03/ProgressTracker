"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import {
  goalService,
  CreateGoalSchema,
  UpdateGoalSchema,
} from "@/server/services/goal.service";
import {
  ActionResponse,
  GoalDTO,
  CreateGoalInput,
  UpdateGoalInput,
} from "@/types";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Server action to create a new goal.
 */
export async function createGoalAction(
  data: CreateGoalInput
): Promise<ActionResponse<GoalDTO>> {
  try {
    const user = await requireUser();
    const goal = await goalService.createGoal(user.id, data);

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    if (goal.sectionId) {
      revalidatePath(`/sections/${goal.sectionId}`);
    }

    return {
      success: true,
      data: goal,
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
        error: "Validation failed. Please check goal inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("createGoalAction error:", error);
    return {
      success: false,
      error: "Failed to create goal. Please try again.",
    };
  }
}

/**
 * Server action to update an existing goal.
 */
export async function updateGoalAction(
  goalId: string,
  data: UpdateGoalInput
): Promise<ActionResponse<GoalDTO>> {
  try {
    const user = await requireUser();
    const goal = await goalService.updateGoal(goalId, user.id, data);

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    if (goal.sectionId) {
      revalidatePath(`/sections/${goal.sectionId}`);
    }

    return {
      success: true,
      data: goal,
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
        error: "Validation failed. Please check goal inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Goal not found.",
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("updateGoalAction error:", error);
    return {
      success: false,
      error: "Failed to update goal. Please try again.",
    };
  }
}

/**
 * Server action to delete a goal.
 */
export async function deleteGoalAction(
  goalId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await requireUser();
    await goalService.deleteGoal(goalId, user.id);

    revalidatePath("/dashboard");
    revalidatePath("/goals");

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Goal not found.",
      };
    }

    console.error("deleteGoalAction error:", error);
    return {
      success: false,
      error: "Failed to delete goal.",
    };
  }
}

/**
 * Server action to update goal progress value.
 */
export async function updateGoalProgressAction(
  goalId: string,
  progress: number
): Promise<ActionResponse<GoalDTO>> {
  try {
    const user = await requireUser();
    const goal = await goalService.updateGoalProgress(goalId, user.id, progress);

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    if (goal.sectionId) {
      revalidatePath(`/sections/${goal.sectionId}`);
    }

    return {
      success: true,
      data: goal,
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
        error: "Goal not found.",
      };
    }
    console.error("updateGoalProgressAction error:", error);
    return {
      success: false,
      error: "Failed to update goal progress.",
    };
  }
}

/**
 * Server action to toggle goal pause/resume status.
 */
export async function toggleGoalPauseAction(
  goalId: string
): Promise<ActionResponse<GoalDTO>> {
  try {
    const user = await requireUser();
    const goal = await goalService.togglePauseGoal(goalId, user.id);

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    if (goal.sectionId) {
      revalidatePath(`/sections/${goal.sectionId}`);
    }

    return {
      success: true,
      data: goal,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Goal not found.",
      };
    }
    console.error("toggleGoalPauseAction error:", error);
    return {
      success: false,
      error: "Failed to toggle goal pause state.",
    };
  }
}

/**
 * Server action to mark a goal as completed.
 */
export async function completeGoalAction(
  goalId: string
): Promise<ActionResponse<GoalDTO>> {
  try {
    const user = await requireUser();
    const goal = await goalService.completeGoal(goalId, user.id);

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    if (goal.sectionId) {
      revalidatePath(`/sections/${goal.sectionId}`);
    }

    return {
      success: true,
      data: goal,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Goal not found.",
      };
    }
    console.error("completeGoalAction error:", error);
    return {
      success: false,
      error: "Failed to complete goal.",
    };
  }
}
