import ConnectDb from "@/utils/db";
import { errorResponse } from "@/utils/response";
import authChecker from "@/middleware/authChecker";
import limitCheker from "@/middleware/limitCheker";
import { UserProblem } from "@/models/userProblemModel";

export default async function (req, res) {
  console.log("hit");
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
  console.log("this is id", id);
  if (!id) {
    try {
      const data = await UserProblem.find().select(
        "title difficulty acceptance _id"
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
      const data = await UserProblem.findById(id);
      if (!data) {
        res.status(404).json({ message: "no such problemm exists" });
      }
      console.log("fetching problem", data, id);
      res.status(200).json({ ...data, testCase: data.testCase.slice(0, 3) });
    } catch (error) {
      console.log(error, "error in finding by id ");
      res.status(404).json({ message: "no such problemm exists" });
    }
  }
}
