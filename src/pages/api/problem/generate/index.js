import authChecker from "@/middleware/authChecker";
import limitCheker from "@/middleware/limitCheker";
import { errorResponse } from "@/utils/response";
import { OpenAI } from "openai";

console.log("api key ", process.env.NEXT_API_OPEN_API);

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_API_OPEN_API,
});

export default async function (req, res) {
  if (req.method !== "POST") {
    res.status(300).json({ message: "http method is not supported" });
  }

  const { problem, constraints, hint, language } = req.body;
  console.log(problem, constraints);

  if (!problem || problem.length === 0) {
    return res.status(400).json({ message: "problem is required" });
  }

  const selectedLanguage = language || "cpp";

  const user = await authChecker(req, res);
  if (!user) {
    return;
  }

  const checkLimit = await limitCheker(req, res, user._id, 1);
  if (!checkLimit) {
    res
      .status(301)
      .json(
        errorResponse(
          "Daily limit completed , pleases upgrade to premium plan to continue",
          "USER_ERROR"
        )
      );
    return;
  }

  // Define input handling instructions based on language
  const inputInstructions = {
    python:
      "In Python, the main function should take input from sys.argv (command line arguments). use sys.argv[1], sys.argv[2], etc. for inputs. ALWAYS import sys at the top.",
    cpp: "In C++, the main function should take input directly using cin (e.g., cin >> variable_name). and code should be written in cpp 11",
    java: "In Java, the main function should take input directly using Scanner class.",
    javascript:
      "In JavaScript, use process.argv for command line arguments or readline for interactive input.",
  };

  const messages = [
    {
      role: "system",
      content: `You are a professional coding master, specialized in creating correct and optimized solutions. 
      
      IMPORTANT FORMATTING RULES:
      - Generate a single, complete, ready-to-run solution for ${selectedLanguage}
      - Include all necessary header files/imports at the top
      - The code should be a complete, executable program
      - ${inputInstructions[selectedLanguage] || inputInstructions.cpp}
      - Only print the final answer, nothing else (no prompts like "enter size", etc.)
      - The code should handle input/output properly and contain all the problem-solving logic
      - Make sure the code is optimized and follows best practices
      
      CRITICAL PYTHON REQUIREMENTS (if Python is selected):
      - The Python code MUST start with "import sys" as the first line
      - The Python code MUST use sys.argv for command line arguments (sys.argv[1], sys.argv[2], etc.)
      - The Python code MUST have "if __name__ == '__main__':" at the end to execute the main logic
      - Structure for Python: import sys → functions → main logic → if __name__ == '__main__': main()
      
      RESPONSE FORMAT:
      You must return a JSON object with exactly these properties:
      {
        "explanation": "detailed explanation of the approach and algorithm",
        "completeCode": "the complete, ready-to-run solution code for ${selectedLanguage}"
      }
      
      Do NOT use markdown code blocks or any other formatting. Return only the plain JSON object.`,
    },
    {
      role: "user",
      content: `Generate an optimal complete solution for this problem in ${selectedLanguage}:
      
      Problem: ${problem}
      ${constraints.length ? `Constraints: ${constraints}` : ""}
      ${hint ? `Hint: ${hint}` : ""}
      
      Remember to:
      1. Analyze the problem and choose the appropriate DSA approach
      2. Create a single, complete, executable program
      3. Include all necessary headers/imports
      4. Handle input/output properly according to the language requirements
      5. Make the code optimized and efficient
      6. Return the response in the specified JSON format`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
    });

    console.log("OpenAI Response:", response.choices[0].message.content);

    let data;
    try {
      data = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // Attempt to extract JSON from response if it's wrapped in code blocks
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON response from OpenAI");
      }
    }

    // Validate response structure
    if (!data.explanation || !data.completeCode) {
      throw new Error(
        "Invalid response structure from OpenAI - missing required fields"
      );
    }

    // Additional validation for Python code
    if (selectedLanguage === "python") {
      const pythonCode = data.completeCode;
      const requiredPythonElements = [
        "import sys",
        "def ",
        "sys.argv",
        'if __name__ == "__main__":',
      ];

      const missingElements = requiredPythonElements.filter(
        (element) => !pythonCode.includes(element)
      );

      if (missingElements.length > 0) {
        console.warn("Python code missing elements:", missingElements);
      }
    }

    // Return structured response - keeping the old fields as empty strings for compatibility
    res.status(200).json({
      language: selectedLanguage,
      explanation: data.explanation,
      code: data.completeCode, // New field with the complete solution
      helperFunction: "", // Empty string for backward compatibility
      mainFunction: "", // Empty string for backward compatibility
      pythonMainFunction: "", // Empty string for backward compatibility
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      error: error.message,
      details: "Failed to generate code solution",
    });
  }
}
