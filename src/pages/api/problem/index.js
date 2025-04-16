import { Problem } from "@/models/problemModel";
import connectDb from "../../../db.js";
export default async function (req, res) {
  connectDb();
  switch (req.method) {
    case "GET":
      const problem = await Problem.find();

      res.status(200).json(problem);

      break;
    case "POST":
      const { title, description, difficulty, example, tags, constraints } =
        req.body;
      if (
        !title ||
        !description ||
        !tags ||
        !constraints ||
        !tags ||
        !difficulty
      ) {
        res.status(404).json({ message: "all fields are requireed" });
      }
      const newProblem = new Problem({
        title,
        description,
        tags,
        constraints,
        example,
        difficulty,
      });
      const newProb = await newProblem.save({ validateBeforeSave: true });
      if (newProb) {
        res.status(200).json(newProb);
      }

    default:
      res.status(200).json({ message: "method not allowed" });
      break;
  }
}
