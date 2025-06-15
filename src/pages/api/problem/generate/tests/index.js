const WebSocket = require("ws");

import ConnectDb from "@/utils/db";
import { Problem } from "@/models/problemModel";
import { OpenAI } from "openai";
import authChecker from "@/middleware/authChecker";
import limitCheker from "@/middleware/limitCheker";
import { errorResponse } from "@/utils/response";
import { UserProblem } from "@/models/userProblemModel";

console.log(process.env.NEXT_PUBLIC_API_OPEN_API);
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_API_OPEN_API,
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

function truncateString(str, maxLength = 1000) {
  if (typeof str === "string" && str.length > maxLength) {
    console.warn(
      `⚠️ Truncating string from ${str.length} to ${maxLength} characters`
    );
    return str.substring(0, maxLength);
  }
  return str;
}

function parseTestCaseJSArray(raw) {
  try {
    console.log("🔍 Raw input received length:", raw.length);
    console.log("🔍 Raw input preview:", raw.substring(0, 500) + "...");

    // Step 1: Extract JSON from markdown code blocks if present
    let cleanedContent = raw.trim();

    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    const codeBlockMatch = cleanedContent.match(
      /```(?:json)?\s*([\s\S]*?)\s*```/
    );
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1].trim();
      console.log("🧹 Extracted from code block");
    }

    // Step 2: Pre-process and limit string lengths to prevent JSON parsing issues
    console.log("🔧 Processing .repeat() expressions and concatenations...");

    // Function to safely evaluate .repeat() expressions with size limits
    const processRepeatExpressions = (content) => {
      // Handle patterns like "100 " + "a".repeat(1000) with size limits
      content = content.replace(
        /"([^"]*?)"\s*\+\s*"([^"]*?)"\.repeat\((\d+)\)/g,
        (match, prefix, str, count) => {
          const repeatCount = Math.min(parseInt(count), 500); // Limit repetitions
          const repeatedString = str.repeat(repeatCount);
          const truncatedResult = truncateString(prefix + repeatedString, 800);
          return `"${truncatedResult}"`;
        }
      );

      // Handle simple concatenations like "a" + "b"
      content = content.replace(
        /"([^"]*?)"\s*\+\s*"([^"]*?)"/g,
        (match, str1, str2) => {
          const combined = str1 + str2;
          const truncated = truncateString(combined, 800);
          return `"${truncated}"`;
        }
      );

      // Handle standalone .repeat() patterns like "a".repeat(1000) with limits
      content = content.replace(
        /["']([^"']*?)["']\.repeat\((\d+)\)/g,
        (match, str, count) => {
          const repeatCount = Math.min(parseInt(count), 500); // Limit repetitions
          const repeatedString = str.repeat(repeatCount);
          const truncated = truncateString(repeatedString, 800);
          return `"${truncated}"`;
        }
      );

      return content;
    };

    // Apply repeat processing with limits
    cleanedContent = processRepeatExpressions(cleanedContent);
    console.log("✅ Processed .repeat() expressions and concatenations");

    // Step 3: Clean up any remaining formatting issues
    cleanedContent = cleanedContent
      .replace(/^\s*content:\s*'?/, "") // remove `content:` line if present
      .replace(/\\\\n/g, " ") // replace escaped newlines with spaces
      .replace(/\\n/g, " ") // replace newlines with spaces
      .replace(/'\s*\+\s*'/g, "") // join broken string lines
      .replace(/\n/g, " ") // replace actual newlines with spaces
      .trim();

    // Step 4: Check for potential JSON truncation issues
    if (!cleanedContent.endsWith("]") && !cleanedContent.endsWith("}")) {
      console.warn("⚠️ Content may be truncated, attempting to fix...");

      // Try to find the last complete test case
      const lastCompleteMatch = cleanedContent.lastIndexOf('"}');
      if (lastCompleteMatch !== -1) {
        cleanedContent =
          cleanedContent.substring(0, lastCompleteMatch + 2) + "]";
        console.log(
          "🔧 Fixed truncated JSON by finding last complete test case"
        );
      } else {
        // Fallback: try to close the JSON properly
        if (cleanedContent.includes("[")) {
          cleanedContent = cleanedContent + '"}]';
        }
      }
    }

    console.log("🔧 After cleanup length:", cleanedContent.length);

    // Step 5: Try to parse as JSON first
    let testCaseArray;
    try {
      testCaseArray = JSON.parse(cleanedContent);
      console.log("✅ Successfully parsed as JSON");
    } catch (jsonError) {
      console.log("⚠️ JSON parse failed, trying alternative methods...");
      console.log("JSON Error:", jsonError.message);

      // Step 6: Try to fix common JSON issues
      let fixedContent = cleanedContent
        .replace(/'([^']*)'/g, (_, g1) => `"${g1}"`) // single to double quotes
        .replace(/,\s*]/g, "]") // remove trailing commas in arrays
        .replace(/,\s*}/g, "}") // remove trailing commas in objects
        .replace(/\+\s*"/g, ' "') // fix string concatenation issues
        .replace(/"\s*\+/g, '" ') // fix string concatenation issues
        .replace(/f"[^"]*"/g, '""') // remove f-strings
        .replace(/\.join\([^)]*\)/g, '""') // remove .join expressions
        .replace(/range\([^)]*\)/g, "[]"); // remove range expressions

      try {
        testCaseArray = JSON.parse(fixedContent);
        console.log("✅ Successfully parsed after fixing quotes");
      } catch (stillError) {
        console.log("⚠️ Still failed, trying manual cleaning...");
        console.log("Second JSON Error:", stillError.message);

        // Step 7: More aggressive cleaning for malformed expressions
        try {
          // Find where the JSON might be broken and try to salvage what we can
          const errorPosition = stillError.message.match(/position (\d+)/);
          if (errorPosition) {
            const pos = parseInt(errorPosition[1]);
            console.log(`🔧 Attempting to fix JSON at position ${pos}`);

            // Try to find a safe truncation point before the error
            const safeContent = fixedContent.substring(0, pos);
            const lastCompleteObject = safeContent.lastIndexOf("}");

            if (lastCompleteObject !== -1) {
              fixedContent =
                safeContent.substring(0, lastCompleteObject + 1) + "]";
              console.log("🔧 Truncated to last complete object");
            }
          }

          // Remove any remaining complex expressions
          fixedContent = fixedContent
            .replace(/"\s*\+\s*[^"]*\.(repeat|join)[^"]*"/g, '""') // remove complex expressions
            .replace(/"\s*\+\s*[^"]*for\s+[^"]*in[^"]*"/g, '""') // remove list comprehensions
            .replace(/\s+/g, " ") // normalize whitespace
            .replace(/,\s*,/g, ",") // remove double commas
            .replace(/\[\s*,/g, "[") // fix leading commas in arrays
            .replace(/,\s*\]/g, "]") // fix trailing commas in arrays
            .replace(/{\s*,/g, "{") // fix leading commas in objects
            .replace(/,\s*}/g, "}"); // fix trailing commas in objects

          testCaseArray = JSON.parse(fixedContent);
          console.log("✅ Successfully parsed after aggressive cleaning");
        } catch (finalError) {
          console.log("❌ Final parse attempt failed:", finalError.message);

          // Last resort: try to extract individual test cases using regex
          try {
            const testCaseMatches = cleanedContent.match(
              /\{"input":\s*\[[^\]]*\],\s*"expected":\s*"[^"]*"\}/g
            );
            if (testCaseMatches && testCaseMatches.length > 0) {
              const validTestCases = testCaseMatches
                .map((match) => {
                  try {
                    return JSON.parse(match);
                  } catch (e) {
                    return null;
                  }
                })
                .filter((tc) => tc !== null);

              if (validTestCases.length > 0) {
                testCaseArray = validTestCases;
                console.log(
                  `✅ Extracted ${validTestCases.length} test cases using regex fallback`
                );
              } else {
                throw new Error("No valid test cases could be extracted");
              }
            } else {
              throw new Error(
                `Cannot parse content. Final error: ${finalError.message}`
              );
            }
          } catch (regexError) {
            throw new Error(
              `Cannot parse content. Final error: ${finalError.message}`
            );
          }
        }
      }
    }

    // Step 8: Validate the structure
    if (!Array.isArray(testCaseArray)) {
      throw new Error("Parsed content is not an array");
    }

    if (testCaseArray.length === 0) {
      throw new Error("Test case array is empty");
    }

    // Step 9: Validate each test case and truncate overly long inputs
    const validTestCases = [];
    for (let i = 0; i < testCaseArray.length; i++) {
      const tc = testCaseArray[i];
      if (tc.input && tc.hasOwnProperty("expected")) {
        // Truncate overly long inputs
        const processedInput = Array.isArray(tc.input)
          ? tc.input.map((inp) => truncateString(String(inp), 1000))
          : [truncateString(String(tc.input), 1000)];

        const processedExpected = truncateString(String(tc.expected), 1000);

        // Additional validation: check if input is reasonable
        const inputStr = processedInput[0];
        if (
          typeof inputStr === "string" &&
          !inputStr.includes("\\n") &&
          !inputStr.includes("\n") &&
          inputStr.length < 2000 // Reasonable length limit
        ) {
          validTestCases.push({
            input: processedInput,
            expected: processedExpected,
          });
        } else {
          console.warn(`⚠️ Test case ${i} has issues, skipping:`, {
            inputLength: inputStr ? inputStr.length : 0,
            hasNewlines: inputStr
              ? inputStr.includes("\\n") || inputStr.includes("\n")
              : false,
          });
        }
      } else {
        console.warn(
          `⚠️ Test case ${i} missing required fields, skipping:`,
          tc
        );
      }
    }

    if (validTestCases.length === 0) {
      throw new Error("No valid test cases found after cleaning");
    }

    console.log(
      `✅ Successfully parsed ${validTestCases.length} valid test cases`
    );

    // Step 10: Expand any remaining repeat expressions (keeping existing logic for fallback)
    const expanded = validTestCases.map(({ input, expected }, index) => {
      try {
        return {
          input: input.map((e) => {
            const evaluated = evaluateRepeatExpression(JSON.stringify(e));
            return truncateString(evaluated.replace(/^"|"$/g, ""), 1000); // Remove quotes if added by JSON.stringify
          }),
          expected: (() => {
            const evaluated = evaluateRepeatExpression(
              JSON.stringify(expected)
            );
            return truncateString(evaluated.replace(/^"|"$/g, ""), 1000); // Remove quotes if added by JSON.stringify
          })(),
        };
      } catch (error) {
        console.warn(`⚠️ Error processing test case ${index}:`, error);
        return {
          input: input.map((e) => truncateString(String(e), 1000)),
          expected: truncateString(String(expected), 1000),
        };
      }
    });

    return { ok: true, data: expanded };
  } catch (err) {
    console.error("❌ Complete parsing failure:", err);
    return { ok: false, error: `❌ Failed to parse: ${err.message}` };
  }
}

function normalizeExpression(expr) {
  // Skip strings that don't look like shorthand
  if (!expr.includes("*")) return expr;

  // Add quotes and "+" between parts: convert a*3b*3 → "a"*3 + "b"*3
  const parts = expr.match(/[a-zA-Z ]*\*\d+/g); // Match a*500, b*500, space*300 etc.
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
  expr = expr.replace(/(".?"\s*\*\s*\d+)\s*(?=")/g, "$1 + ");
  expr = expr.replace(/(".?")\s(?=")/g, "$1 + "); // join plain strings too
  expr = expr.replace(/(".?"\s*\*\s*\d+)(?=\s|$)/g, "$1"); // keep others intact

  // Now split using '+'
  return expr
    .split("+")
    .map((part) => {
      part = part.trim();

      const match = part.match(/^"(.+)"\s*\*\s*(\d+)$/); // "abc" * 3
      if (match) {
        const [, str, count] = match;
        const repeatCount = Math.min(Number(count), 500); // Limit repetitions
        const result = str.repeat(repeatCount);
        return truncateString(result, 1000);
      }

      const quoted = part.match(/^"(.+)"$/); // just "abc"
      if (quoted) return truncateString(quoted[1], 1000);

      return truncateString(part, 1000); // fallback
    })
    .join("");
}

function expandTestCaseObject(obj) {
  const actualInput = [];

  for (let inp of obj.input) {
    const expanded = expandShorthandString(normalizeExpression(inp));
    actualInput.push(truncateString(expanded, 1000));
  }

  return {
    input: actualInput,
    expected: truncateString(
      expandShorthandString(normalizeExpression(obj.expected)),
      1000
    ),
  };
}

// Enhanced prompt for better test case generation with size limits
function generateEnhancedPrompt(problem, constraint, code, language) {
  return [
    {
      role: "system",
      content: `You are an expert competitive programming test case generator. Your primary goal is to create test cases that expose logical flaws, edge cases, and algorithmic weaknesses in the provided code.

CRITICAL REQUIREMENTS:

1. Generate exactly 20-30 test cases total (reduced for better parsing)
2. Distribution: 80% logic/edge case checkers (16-24 cases) + 20% performance (TLE/MLE) checkers (4-6 cases)
3. Return ONLY a valid JSON array - no markdown code blocks, no explanations, no extra text
4. Do NOT wrap your response in \`\`\`json code blocks - return raw JSON only
5. NEVER use newline characters (\\n) in input strings - they cause parsing errors
6. NEVER use string concatenation (+) or JavaScript expressions in JSON
7. For repeated patterns, write out reasonable lengths (max 100 characters per string)
8. For multi-line inputs, concatenate everything into single strings without \\n
9. Maximum string length in any test case should be 100 characters
10. Keep total response under 10KB to prevent truncation

CRITICAL INPUT FORMAT RULES:

❌ WRONG: ["100 " + "a".repeat(1000)] (contains concatenation)
❌ WRONG: ["3\\n1 5\\n2 6\\n3 7"] (contains \\n)
❌ WRONG: Very long strings over 100 characters
✅ CORRECT: ["3 1 5 2 6 3 7"] (single line, space-separated)
✅ CORRECT: ["100 abcdefghijklmnopqrstuvwxyz"] (reasonable length)

FOR REPEATED PATTERNS:
- Instead of using .repeat(), write out patterns up to 50-100 characters max
- Focus on algorithmic edge cases rather than extremely long strings
- Example: "aaaaaaaaaaaaaaaaaaaaaa" (22 a's) instead of "a".repeat(1000)

JSON FORMAT EXAMPLE:
[
  {"input": ["5"], "expected": "25"},
  {"input": ["0"], "expected": "0"},
  {"input": ["2 1 5 2 6"], "expected": "2"},
  {"input": ["100 abcdefghijklmnopqrstuvwxyz"], "expected": "YES"}
]

TEST CASE CATEGORIES (Focus on quality over quantity):

A. Fundamental Edge Cases (6-8 cases):
- Single word cases
- Two identical words
- Minimum constraint cases
- Words with all same characters

B. Algorithm-Specific Logic Breakers (8-12 cases):
- Lexicographically challenging cases
- Cases where sorting creates different orderings
- Anagram detection edge cases
- Character frequency analysis tests

C. Character Pattern Edge Cases (4-6 cases):
- Single character differences
- Repeated characters in different positions
- Alphabetical boundary cases

D. Performance Tests (4-6 cases):
- Larger inputs (N=20-50) with reasonable word lengths
- Worst-case scenarios for the algorithm
- Many similar words requiring extensive comparison

RESPONSE SIZE LIMITS:
- Keep each test case input under 100 characters
- Total response should be under 10KB
- Focus on algorithmic complexity, not string length
- Prefer 25 high-quality test cases over 50 mediocre ones

CRITICAL: Return ONLY the JSON array, no other text, no markdown formatting, no JavaScript expressions, all strings kept to reasonable lengths.`,
    },
    {
      role: "user",
      content: `PROBLEM: ${problem}

CONSTRAINTS: ${constraint}

CODE TO TEST: ${code}

LANGUAGE: ${language}

Generate 20-30 strategic test cases following the rules above. Remember:

- NO \\n characters in input strings
- NO concatenation (+) or .repeat() expressions  
- NO JavaScript code in JSON - only pure JSON
- Keep all strings under 100 characters
- Multi-line inputs should be single-line space-separated
- Return ONLY the JSON array
- Focus on algorithmic edge cases, not string length

Generate the test cases now:`,
    },
  ];
}

export default async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    problem,
    constraint,
    code,
    recruiterQuestion,
    mainFunction,
    language,
    pythonMainFunction,
    title,
  } = req.body;

  if (!problem || !code) {
    return res.status(400).json({ message: "Problem and code are required" });
  }

  const user = await authChecker(req, res);
  if (!user) {
    return;
  }

  // Use the enhanced prompt with size limits
  const messages = generateEnhancedPrompt(problem, constraint, code, language);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.2,
      max_tokens: 2500, // Reduced to prevent overly long responses
    });

    const raw = response.choices[0].message.content;
    console.log("📥 Raw OpenAI response length:", raw.length);
    console.log("📄 Raw response preview:", raw.substring(0, 500) + "...");

    const { ok, data, error } = parseTestCaseJSArray(raw);

    if (!ok) {
      console.error("❌ Failed to parse test cases:", error);
      return res
        .status(500)
        .json({ error: `Failed to parse test cases: ${error}` });
    }

    console.log(`✅ Generated ${data.length} test cases successfully`);

    const testCases = [];
    for (let tc of data) {
      try {
        testCases.push(expandTestCaseObject(tc));
      } catch (expandError) {
        console.warn("⚠️ Error expanding test case:", expandError, tc);
        // Skip problematic test cases instead of failing entirely
        continue;
      }
    }

    console.log(`📊 Final processed test cases count: ${testCases.length}`);

    if (testCases.length === 0) {
      return res.status(500).json({
        error: "No valid test cases generated",
        details: "All test cases failed to process",
      });
    }

    // WebSocket communication with enhanced error handling
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_WEBSOCKET_URL}`);

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket timeout after 5 minutes"));
      }, 300000);

      ws.on("open", () => {
        console.log("WebSocket connected, sending test cases...");
        ws.send(
          JSON.stringify({
            editorCode: code,
            testCase: testCases,
            selectedLanguage: language,
            all: true,
            exampleTestCases: false,
          })
        );
      });

      ws.on("message", async (data) => {
        try {
          const result = JSON.parse(data);
          console.log("WebSocket response received");

          await ConnectDb();

          const problemData = {
            description: problem,
            testCase: result.data,
            constraints: constraint,
            difficulty: "medium",
            title: title || "Generated Problem",
            templateCode: mainFunction,
            pythonTemplateCode: pythonMainFunction,
          };

          let newProblem;
          if (recruiterQuestion) {
            const newProb = new Problem(problemData);
            newProblem = await newProb.save();
            console.log("Problem added to main collection:", newProblem._id);
          } else {
            const newProb = new UserProblem(problemData);
            newProblem = await newProb.save();
            console.log("Problem added to user collection:", newProblem._id);
          }

          clearTimeout(timeout);
          ws.close();

          resolve({
            status: "success",
            message: `Generated ${testCases.length} test cases successfully`,
            url: `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/problems/${
              newProblem._id
            }?RQP=${recruiterQuestion || ""}`,
            testCaseCount: testCases.length,
          });
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
          clearTimeout(timeout);
          ws.close();
          resolve({
            status: "error",
            message: `Error in saving problem: ${error.message}`,
          });
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(timeout);
        ws.close();
        reject(new Error(`WebSocket error: ${error.message}`));
      });

      ws.on("close", (code, reason) => {
        console.log(`WebSocket closed: ${code} - ${reason}`);
        clearTimeout(timeout);
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to generate test cases",
    });
  }
}
