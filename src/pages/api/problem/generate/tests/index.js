const WebSocket = require("ws");

import ConnectDb from "@/db";
import { Problem } from "@/models/problemModel";
import { OpenAI } from "openai";
const openai = new OpenAI({
  apiKey: process.env.NEXT_API_OPEN_API,
});

function evaluateRepeatExpression(expr) {
  try {
    if (
      /^"[^"]*"\.repeat\(\d+\)(\s*\+\s*"[^"]*"\.repeat\(\d+\))*$/.test(expr) ||
      /^"[^"]*"\s*\+\s*".*"$/.test(expr) || // basic string concat
      /^"[^"]+"$/.test(expr) // just quoted string
    ) {
      return eval(expr);
    }
    return expr;
  } catch (e) {
    console.warn("⚠️ Failed eval:", expr);
    return expr;
  }
}

function parseTestCaseJSArray(raw) {
  try {
    // Step 1: Clean up the messy GPT formatting
    raw = raw
      .replace(/^\s*content:\s*'?/, "") // remove `content:` line
      .replace(/\\n/g, "") // remove escaped newlines
      .replace(/'\s*\+\s*'/g, "") // join broken string lines
      .replace(/'([^']*)'/g, (_, g1) => `"${g1}"`) // single to double quotes
      .replace(/,\s*]/g, "]"); // remove trailing commas

    // Step 2: Use eval to convert into a JavaScript array
    const testCaseArray = eval(raw); // ☠️ only use if you're sure content is safe

    // Step 3: Expand repeat expressions
    const expanded = testCaseArray.map(({ input, expected }) => ({
      input: input.map((e) => evaluateRepeatExpression(JSON.stringify(e))),
      expected: evaluateRepeatExpression(JSON.stringify(expected)),
    }));

    return { ok: true, data: expanded };
  } catch (err) {
    return { ok: false, error: `❌ Failed to parse: ${err.message}` };
  }
}

function normalizeExpression(expr) {
  // Skip strings that don't look like shorthand
  if (!expr.includes("*")) return expr;

  // Add quotes and "+" between parts: convert a*3b*3 → "a"*3 + "b"*3
  const parts = expr.match(/[a-zA-Z ]\*\d+/g); // Match a*500, b*500, space*300 etc.
  if (!parts) return expr;

  return parts
    .map((part) => {
      const [char, num] = part.split("*");
      return `"${char}"*${num}`;
    })
    .join(" + ");
}

function expandShorthandString(expr) {
  // If no '*' or quotes, assume it's a literal string
  if (!expr.includes("*")) return expr;

  // Add '+' between string multipliers and next string/multiplier if not already
  expr = expr.replace(/(".*?"\s*\*\s*\d+)\s+(?=")/g, "$1 + ");
  expr = expr.replace(/(".*?")\s+(?=")/g, "$1 + "); // join plain strings too
  expr = expr.replace(/(".*?"\s*\*\s*\d+)(?=\s|$)/g, "$1"); // keep others intact

  // Now split using '+'
  return expr
    .split("+")
    .map((part) => {
      part = part.trim();

      const match = part.match(/^"(.+)"\s*\*\s*(\d+)$/); // "abc" * 3
      if (match) {
        const [, str, count] = match;
        return str.repeat(Number(count));
      }

      const quoted = part.match(/^"(.+)"$/); // just "abc"
      if (quoted) return quoted[1];

      return part; // fallback
    })
    .join("");
}
function sanitizeGPTTestcaseJSON(raw) {
  // Fix expressions like "a"*500 + "b"*500 → "a*500 + b*500"
  raw = raw.replace(
    /"([a-zA-Z ])"\s*\*\s*\d+(\s*\+\s*"([a-zA-Z ])"\s*\*\s*\d+)*/g,
    (match) => {
      // Replace each Python-style bit with string-form shorthand
      const cleaned = match
        .split("+")
        .map((segment) => {
          const [_, char, count] =
            segment.match(/"([^"]+)"\s*\*\s*(\d+)/) || [];
          return `${char}*${count}`;
        })
        .join(" + ");
      return `"${cleaned}"`;
    }
  );

  // Also handle single * cases: "a"*500 → "a*500"
  raw = raw.replace(/"([a-zA-Z ])"\s*\*\s*(\d+)/g, (_, char, count) => {
    return `"${char}*${count}"`;
  });

  return raw;
}

function expandTestCaseObject(obj) {
  const actualInput = [];

  for (let inp of obj.input) {
    actualInput.push(expandShorthandString(normalizeExpression(inp)));
  }
  //   console.log("now", actualInput);

  return {
    input: actualInput,
    expected: expandShorthandString(normalizeExpression(obj.expected)),
  };
}

export default async function (req, res) {
  if (req.method !== "POST") {
    res.status(300).json({ message: "http method is not allowed" });
  }
  const { problem, constraint, code } = req.body;
  if (!problem || !code) {
    res.status(400).json({ message: "problem or code is required" });
  }

  const messages = [
    {
      role: "system",
      content: `You are a professional competitive programming test case generator. Your job is to generate meaningful, well-balanced test cases for the given problem and code. Follow these strict instructions: 1. Understand the problem and code deeply before generating test cases. Think through constraints, edge cases, and failure points. 2. Generate 5-7 test cases total. Cover: (a) trivial cases (e.g., empty input, smallest input like 0 or 1), (b) normal cases, (c) corner cases, (d) only a few large inputs to test TLE or MLE — don't overuse them. 3. Focus on logic-breaking test cases, especially for greedy vs DP confusion, wrong assumptions in code, sorting bugs, or boundary issues. 4. Ensure all generated test cases produce the correct output using the code provided. 5. Return ONLY a JSON array, and nothing else. No markdown, no explanation. Example of valid format: [{input: ["8 12 16"], expected: "2"}]. 6. Format rules: inputs must be an array of strings (✅ ["1 2 3"], ❌ [1,2,3]), and expected values must be a single string (✅ "2", ❌ 2). 7. For large inputs like long strings or arrays, you may use .repeat() functions of js in string for exapmle [{input:" 'a'.repeat(10) +'b'.repeat(20) ",expected:"5"}] such that after successful parsing the content into json user can elaborate the string (note that .repeat() function should also be stringified to avoid Json parse error  , final output should beasilt parsed as a json)  8. Final output must be a valid JSON array only. Avoid invalid formatting like missing quotes, commas, or using Python dict syntax. 9. You don't need to generate every edge case — just ensure test cases balance correctness, trickiness, and performance tests.`,
    },
    {
      role: "user",
      content: `problem description - ${problem} constraints - ${constraint} code - ${code} `,
    },
  ];
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
    });

    console.log(response.choices[0].message);

    const raw = response.choices[0].message.content;

    const { ok, data, error } = parseTestCaseJSArray(raw);

    if (ok) {
      console.log("✅ Expanded test cases:", data);
    } else {
      console.error("❌ Failed:", error);
    }
    const testCases = [];
    for (let tc of data) {
      testCases.push(expandTestCaseObject(tc));
    }

    const ws = new WebSocket(`${process.env.NEXT_API_WEBSOCKET_URL}`);
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("timeout ...."));
      }, 30000);

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            editorCode: code,
            testCase: testCases,
            selectedLanguage: "C++",
            all: true,
          })
        );
      });

      ws.on("message", async (data) => {
        const result = JSON.parse(data);
        console.log("testcases are", data, result.data);
        try {
          await ConnectDb();
          const newProb = await new Problem({
            description: problem,
            testCase: result.data,
            constraints: constraint,
            difficulty: "medium",
            title: "Question",
          });
          const newProblem = await newProb.save();
          console.log("new prob added successfully ", newProblem);
          clearTimeout(timeout);
          resolve({
            status: "success",
            url: `${process.env.NEXT_API_FRONTEND_PROBLEM}/problems/${newProblem._id}`,
          });
        } catch (error) {
          clearTimeout(timeout);
          resolve(`error in adding ${error}`);
        }
      });
      ws.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
        ws.close();
      });
    });

    res.status(200).send(result);
  } catch (error) {
    console.error("Streaming error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
