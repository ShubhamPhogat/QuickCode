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
      - Always split the solution into THREE separate functions: 
        1. A helper function (containing the main logic) for ${selectedLanguage}
        2. A main function (for input/output) for ${selectedLanguage}
        3. A Python main function (pythonMainFunction) for Python input/output
      - The helper function should contain all the problem-solving logic and include all the header files required at the top
      - The main function should only handle input/output and call the helper function
      - ${inputInstructions[selectedLanguage] || inputInstructions.cpp}
      - In both main functions, only print the final answer, nothing else (no prompts like "enter size", etc.)
      - Name the helper function appropriately based on the problem
      - Do not include header files in the main function parts
      
      CRITICAL PYTHON REQUIREMENTS:
      - The Python main function MUST start with "import sys" as the first line
      - The Python main function MUST use sys.argv for command line arguments (sys.argv[1], sys.argv[2], etc.)
      - The Python main function MUST have "if __name__ == '__main__':" at the end to call the main function
      - The Python main function should contain both the helper logic AND input/output handling in one complete script
      - Structure for Python: import sys → helper function → main function → if __name__ == '__main__': main()
      
      RESPONSE FORMAT:
      You must return a JSON object with exactly these properties:
      {
        "explanation": "detailed explanation of the approach and algorithm",
        "helperFunction": "the helper function code with all headers at top and logic",
        "mainFunction": "the main function code that handles input/output and calls helper for ${selectedLanguage}",
        "pythonMainFunction": "the complete Python script with import sys, helper function, main function, and if __name__ == '__main__': main()"
      }
      
      Do NOT use markdown code blocks or any other formatting. Return only the plain JSON object.`,
    },
    {
      role: "user",
      content: `Generate an optimal solution for this problem in ${selectedLanguage} and also provide a Python version:
      
      Problem: ${problem}
      ${constraints.length ? `Constraints: ${constraints}` : ""}
      ${hint ? `Hint: ${hint}` : ""}
      
      Remember to:
      1. Analyze the problem and choose the appropriate DSA approach
      2. Split into helper function (with headers + logic) and main function (input/output) for ${selectedLanguage}
      3. Create a complete Python script that uses sys.argv for input and includes the execution guard
      4. Use proper input handling for both ${selectedLanguage} and Python (sys.argv for Python)
      5. Structure for Python: import sys → helper → main → if __name__ == '__main__': main()
      6. Return the response in the specified JSON format`,
    },
    {
      role: "system",
      content: `CRITICAL: Ensure the Python function follows this EXACT structure:

      import sys
      
      def helper_function_name(parameters):
          # all the logic here
          return result
      
      def main():
          # parse sys.argv[1], sys.argv[2], etc.
          # call helper function
          # print result
      
      if __name__ == "__main__":
          main()
      
      The pythonMainFunction must be a complete, executable Python script that:
      1. Starts with "import sys"
      2. Contains the helper function with the algorithm logic
      3. Contains a main() function that uses sys.argv for input
      4. Ends with "if __name__ == '__main__': main()" to execute the script
      
      Example format:
      {
        "explanation": "your detailed explanation here",
        "helperFunction": "complete helper function code with headers at top here",
        "mainFunction": "complete main function code for ${selectedLanguage} here",
        "pythonMainFunction": "import sys\\n\\ndef solve(params):\\n    # logic\\n    return result\\n\\ndef main():\\n    # use sys.argv[1], sys.argv[2], etc.\\n    result = solve(params)\\n    print(result)\\n\\nif __name__ == '__main__':\\n    main()"
      }`,
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
    if (
      !data.explanation ||
      !data.helperFunction ||
      !data.mainFunction ||
      !data.pythonMainFunction
    ) {
      throw new Error(
        "Invalid response structure from OpenAI - missing required fields"
      );
    }

    // Additional validation for Python code
    const pythonCode = data.pythonMainFunction;
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
      // Could add automatic fixes here or regenerate
    }

    // Return structured response
    res.status(200).json({
      language: selectedLanguage,
      explanation: data.explanation,
      helperFunction: data.helperFunction,
      mainFunction: data.mainFunction,
      pythonMainFunction: data.pythonMainFunction,
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
