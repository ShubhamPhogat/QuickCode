import { webSocketManager } from "@/utils/webSocketManager";

const ws = null;

const initConnection = function () {
  ws = new WebSocket("ws://localhost:8080");
};

export default async function (req, res) {
  console.log("hit");
  if (req.method !== "POST") {
    res.status(400).json({ message: "invalid reques" });
  }
  const { code, language, questionId } = req.body;
  if (!code || !language || !questionId) {
    res.status(400).json({ message: "missing required parameters" });
  }
  const Job = { code, language, questionId };
  console.log(Job);
  return res.status(200).json({ message: "ok" });
}
