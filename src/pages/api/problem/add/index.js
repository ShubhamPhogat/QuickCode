import ConnectDb from "@/utils/db";
import { Problem } from "@/models/problemModel";
import limitCheker from "@/middleware/limitCheker";
import authChecker from "@/middleware/authChecker";
import { errorResponse } from "@/utils/response";

export default async function (req, res) {
  console.log("adding");
  ConnectDb();
  const checkLogin = await authChecker(req, res);
  const checkLimit = await limitCheker(req, res, req.user._id);
  if (!checkLimit.allowed) {
    res
      .status(301)
      .json(
        errorResponse(
          "Daily limit completed , pleases upgrade to premium plan to cntinue",
          "USER_ERROR"
        )
      );
  }
  if (req.method !== "POST") {
    return res
      .status(300)
      .json({ message: "this http method is not supported" });
  }
  try {
    const { description, testCase, constraints, difficulty, title } = req.body;
    const newProb = new Problem({
      description,
      testCase,
      constraints,
      difficulty,
      title,
    });
    const newProblem = await newProb.save();
    console.log("new prob added successfully ", newProblem);
    res.status(200).json({ message: "problem added successfully", newProblem });
  } catch (error) {
    console.error("error in adding new prb", error);
  }
}
