import { User } from "@/models/userModel";
import { errorResponse } from "@/utils/response";

import jwt from "jsonwebtoken";

export default async function (req, res) {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    console.log("token for checking", token);

    if (!token) {
      return res
        .status(401)
        .json(errorResponse("Not authenticated", "NOT_AUTHENTICATED"));
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_API_JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json(errorResponse("Not authenticated", "NOT_AUTHENTICATED"));
    }
    console.log("this is user", user);
    req.user = user;
    req.token = token;
    return user;
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json(errorResponse("Not authenticated", "NOT_AUTHENTICATED"));
  }
}
