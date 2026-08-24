import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/server/auth/password";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { UserDTO } from "@/types";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const userService = {
  /**
   * Registers a new user. Throws ValidationError if email already exists or validation fails.
   */
  async registerUser(input: RegisterInput): Promise<UserDTO> {
    const validated = RegisterSchema.parse(input);

    await connectDB();

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      throw new ValidationError("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(validated.password);

    try {
      const user = await User.create({
        name: validated.name,
        email: validated.email,
        passwordHash,
      });

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      };
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new ValidationError("An account with this email already exists.");
      }
      throw err;
    }
  },

  /**
   * Finds a user by email. Optionally includes passwordHash for authentication.
   */
  async findUserByEmail(email: string, includePassword = false) {
    await connectDB();
    const query = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) {
      query.select("+passwordHash");
    }
    return query.exec();
  },

  /**
   * Finds a user by ID.
   */
  async getUserById(id: string): Promise<UserDTO | null> {
    await connectDB();
    const user = await User.findById(id).exec();
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  },

  /**
   * Gets a user by ID or throws NotFoundError.
   */
  async requireUserById(id: string): Promise<UserDTO> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  },
};
