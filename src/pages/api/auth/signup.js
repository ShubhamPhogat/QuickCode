import { User } from "@/models/userModel";
import { errorResponse, successResponse } from "@/utils/response";
import bcryptjs from "bcryptjs";
import { Snowflake } from "@theinternetfolks/snowflake";
import jwt from "jsonwebtoken";
import connectDb from "@/utils/db";

export default async function (req, res) {
  if (req.method !== "POST") {
    res.status(301).json({ message: "this http method is not allowed" });
  }
  try {
    await connectDb();
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json(errorResponse("All fields are required", "VALIDATION_ERROR"));
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Password must be at least 6 characters",
            "VALIDATION_ERROR"
          )
        );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(errorResponse("Email already exists", "EMAIL_ALREADY_EXISTS"));
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await User.create({
      _id: Snowflake.generate(),
      name,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, iss: new Date().toISOString() },
      process.env.NEXT_PUBLIC_API_JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json(
      successResponse({
        id: user._id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        token,
      })
    );
  } catch (error) {
    console.error("Signup error:", error);
    return res
      .status(500)
      .json(errorResponse("Internal server error", "INTERNAL_SERVER_ERROR"));
  }
}
