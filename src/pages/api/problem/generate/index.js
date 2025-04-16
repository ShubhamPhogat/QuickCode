import { OpenAI } from "openai";
console.log("api key ", process.env.NEXT_API_OPEN_API);
const openai = new OpenAI({
  apiKey: process.env.NEXT_API_OPEN_API,
});
export default async function (req, res) {
  if (req.method !== "POST") {
    res.status(300).json({ message: "http method is not supported" });
  }
  const { problem, constraints, hint } = req.body;
  console.log(problem, constraints);
  if (!problem || problem.length === 0) {
    return res.status(400).json({ message: "problem is required" });
  }

  const messages = [
    {
      role: "system",
      content:
        "You are a professional coding coding master , specialised in creating correct and optimized solutions. write the code into seperate function name of the function should be matching with with the problem and in main function wirte code to input the testcase ,you are only allowed to print the answer in main function nothing more , ex- you won't ask user for the input like cout<<'enter size' etc.",
    },

    {
      role: "user",
      content: `generate optimal soultion for the problem , ${problem} , ${
        constraints.length
          ? `constraints for the problem are ${constraints}`
          : ``
      }  ${hint ? hint : ``}`,
    },
    {
      role: "system",
      content:
        "you analyze the problem carefully , think of DSA approch appropriate for the problem, you first do reasoning of the apprcoh , and can also search web looking for similar problem and solutions , give only proper code comment down all explanations , if the user has'nt specified any specific languae you can code in cpp . format you response into json obejct having two property , explanation , and code both are of string type . dont put ```json{explanation :'',code:'' ``` , just simple give {'exxplanation':'',code:''} } ,if user has'nt specified the coding language , use c++11 as default language  ",
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
    });
    console.log(response.choices[0].message.content);
    const data = JSON.parse(response.choices[0].message.content);
    res.status(200).json(data);
  } catch (error) {
    console.error("Streaming error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
