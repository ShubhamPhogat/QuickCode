import ConnectDb from "@/db";
import { Problem } from "@/models/problemModel";

export default async function (req, res) {
  console.log("adding");
  ConnectDb();
  if (req.method !== "POST") {
    return res
      .status(300)
      .json({ message: "this http method is not supported" });
  }
  try {
    const { description, testCase, constraints, difficulty, title } = req.body;
    const newProb = await new Problem({
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
