"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import {
  activityService,
  CreateActivitySchema,
  UpdateActivitySchema,
} from "@/server/services/activity.service";
import {
  ActionResponse,
  ActivityDTO,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/types";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Server action to record a new completed activity.
 */
export async function createActivityAction(
  data: CreateActivityInput
): Promise<ActionResponse<ActivityDTO>> {
  try {
    const user = await requireUser();
    const activity = await activityService.createActivity(user.id, data);

    revalidatePath("/dashboard");
    revalidatePath("/activities");
    if (activity.sectionId) {
      revalidatePath(`/sections/${activity.sectionId}`);
    }

    return {
      success: true,
      data: activity,
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
        error: "Validation failed. Please check activity inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("createActivityAction error:", error);
    return {
      success: false,
      error: "Failed to record activity. Please try again.",
    };
  }
}

/**
 * Server action to update an existing activity.
 */
export async function updateActivityAction(
  activityId: string,
  data: UpdateActivityInput
): Promise<ActionResponse<ActivityDTO>> {
  try {
    const user = await requireUser();
    const activity = await activityService.updateActivity(activityId, user.id, data);

    revalidatePath("/dashboard");
    revalidatePath("/activities");
    if (activity.sectionId) {
      revalidatePath(`/sections/${activity.sectionId}`);
    }

    return {
      success: true,
      data: activity,
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
        error: "Validation failed. Please check activity inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Activity not found.",
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("updateActivityAction error:", error);
    return {
      success: false,
      error: "Failed to update activity. Please try again.",
    };
  }
}

/**
 * Server action to delete an activity.
 */
export async function deleteActivityAction(
  activityId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await requireUser();
    await activityService.deleteActivity(activityId, user.id);

    revalidatePath("/dashboard");
    revalidatePath("/activities");

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Activity not found.",
      };
    }

    console.error("deleteActivityAction error:", error);
    return {
      success: false,
      error: "Failed to delete activity.",
    };
  }
}
