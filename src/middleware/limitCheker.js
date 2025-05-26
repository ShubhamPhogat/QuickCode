import { User } from "@/models/userModel";
import { errorResponse } from "@/utils/response";

export default async function (req, res, userId, reduceCount) {
  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      res
        .status(400)
        .send(errorResponse("invalid user Id", "INTERNAL_SERVER_ERROR"));
    }
    console.log("this is existing user", existingUser);
    if (existingUser.accountType === "premium") {
      return true;
    }
    console.log("use prev count:", existingUser);
    const today = new Date().toDateString();
    const lastUserDate = existingUser.lastUsedDate.toDateString();
    if (today !== lastUserDate) {
      existingUser.requestCount = 1;
      existingUser.lastUsedDate = today;
      await existingUser.save();
      return true;
    } else {
      if (existingUser.requestCount === 3) {
        return false;
      } else {
        existingUser.requestCount += parseInt(reduceCount);
        await existingUser.save();
        return true;
      }
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(errorResponse("error in limimtChecker", "INTERNAL_SERVER_ERROR"));
  }
}
