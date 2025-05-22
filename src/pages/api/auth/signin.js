import { User } from "@/models/userModel";
import { errorResponse, successResponse } from "@/utils/response";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function (req, res) {
  if (req.method !== "POST") {
    res.status(301).json({ message: "http methods not allowed" });
  }
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json(errorResponse("All fields are required", "VALIDATION_ERROR"));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json(errorResponse("Invalid credentials", "INVALID_CREDENTIALS"));
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json(errorResponse("Invalid credentials", "INVALID_CREDENTIALS"));
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, iss: new Date().toISOString() },
      process.env.NEXT_PUBLIC_API_JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json(
      successResponse({
        id: user._id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        token,
      })
    );
  } catch (error) {
    console.error("Signin error:", error);
    return res
      .status(500)
      .json(errorResponse("Internal server error", "INTERNAL_SERVER_ERROR"));
  }
}
