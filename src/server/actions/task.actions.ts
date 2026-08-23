"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import {
  taskService,
  CreateTaskSchema,
  UpdateTaskSchema,
} from "@/server/services/task.service";
import { ActionResponse, TaskDTO, CreateTaskInput, UpdateTaskInput, TaskStatus } from "@/types";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Server action to create a new task.
 */
export async function createTaskAction(
  data: CreateTaskInput
): Promise<ActionResponse<TaskDTO>> {
  try {
    const user = await requireUser();
    const task = await taskService.createTask(user.id, data);

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    if (task.sectionId) {
      revalidatePath(`/sections/${task.sectionId}`);
    }

    return {
      success: true,
      data: task,
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
        error: "Validation failed. Please check task inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("createTaskAction error:", error);
    return {
      success: false,
      error: "Failed to create task. Please try again.",
    };
  }
}

/**
 * Server action to update an existing task.
 */
export async function updateTaskAction(
  taskId: string,
  data: UpdateTaskInput
): Promise<ActionResponse<TaskDTO>> {
  try {
    const user = await requireUser();
    const task = await taskService.updateTask(taskId, user.id, data);

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    if (task.sectionId) {
      revalidatePath(`/sections/${task.sectionId}`);
    }

    return {
      success: true,
      data: task,
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
        error: "Validation failed. Please check task inputs.",
        errors: fieldErrors,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Task not found.",
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("updateTaskAction error:", error);
    return {
      success: false,
      error: "Failed to update task. Please try again.",
    };
  }
}

/**
 * Server action to toggle task status (complete / reopen).
 */
export async function toggleTaskAction(
  taskId: string,
  targetStatus?: TaskStatus
): Promise<ActionResponse<TaskDTO>> {
  try {
    const user = await requireUser();
    const task = await taskService.toggleTaskStatus(taskId, user.id, targetStatus);

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    if (task.sectionId) {
      revalidatePath(`/sections/${task.sectionId}`);
    }

    return {
      success: true,
      data: task,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Task not found.",
      };
    }

    console.error("toggleTaskAction error:", error);
    return {
      success: false,
      error: "Failed to update task status.",
    };
  }
}

/**
 * Server action to delete a task.
 */
export async function deleteTaskAction(
  taskId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await requireUser();
    await taskService.deleteTask(taskId, user.id);

    revalidatePath("/tasks");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: "Task not found.",
      };
    }

    console.error("deleteTaskAction error:", error);
    return {
      success: false,
      error: "Failed to delete task.",
    };
  }
}
