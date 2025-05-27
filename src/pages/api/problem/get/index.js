import ConnectDb from "@/utils/db";
import { Problem } from "@/models/problemModel";
import { errorResponse } from "@/utils/response";
import authChecker from "@/middleware/authChecker";
import limitCheker from "@/middleware/limitCheker";

export default async function (req, res) {
  if (req.method != "GET") {
    return res
      .status(300)
      .json({ message: "http method of this type is not supported" });
  }
  ConnectDb();
  const user = await authChecker(req, res);
  if (!user) {
    return;
  }

  const { id } = req.query;
  if (!id) {
    try {
      const data = await Problem.find().select(
        "title difficult acceptance _id"
      );
      if (data) {
        return res.status(200).json({ data });
      } else {
        return res.status(400).json({});
      }
    } catch (error) {
      return res.status(500).json({ message: "internal server erro" });
    }
  } else {
    try {
      const data = await Problem.findById(id);
      if (!data) {
        res.status(404).json({ message: "no such problemm exists" });
      }
      console.log("fetching problem", data);
      res.status(200).json({ ...data, testCase: data.testCase.slice(0, 3) });
    } catch (error) {
      console.log(error, "error in finding by id ");
      res.status(404).json({ message: "no such problemm exists" });
    }
  }
}
