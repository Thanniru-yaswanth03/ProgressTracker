"use server";

import { z } from "zod";
import { userService, RegisterSchema } from "@/server/services/user.service";
import { signIn, signOut } from "@/server/auth/auth";
import { ActionResponse, UserDTO } from "@/types";
import { ValidationError } from "@/lib/errors";
import { AuthError } from "next-auth";

/**
 * Server action to register a new user.
 */
export async function registerAction(
  data: z.infer<typeof RegisterSchema>
): Promise<ActionResponse<UserDTO>> {
  try {
    const user = await userService.registerUser(data);
    return {
      success: true,
      data: user,
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
        error: "Please correct the errors in the form.",
        errors: fieldErrors,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during registration. Please try again.",
    };
  }
}

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Server action to log in with email and password credentials.
 */
export async function loginAction(
  credentials: z.infer<typeof LoginSchema>
): Promise<ActionResponse> {
  try {
    const validated = LoginSchema.parse(credentials);
    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid email or password.",
          };
        default:
          return {
            success: false,
            error: "Authentication failed. Please try again.",
          };
      }
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid credentials format.",
      };
    }

    console.error("Login action error:", error);
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }
}

/**
 * Server action to sign out.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
