import React, { useState } from "react";
import {
  Play,
  CloudUpload,
  RefreshCw,
  Maximize,
  Code,
  CheckCircle,
  FileText,
  BookOpen,
  Share2,
  Star,
  ChevronDown,
} from "lucide-react";

const problem = {
  id: 1,
  title: "Two Sum",
  difficulty: "Easy",
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  tags: ["Array", "Hash Table"],
  solved: true,
};

const ProblemDetailPage = () => {
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript");
  const [editorCode, setEditorCode] = useState(`
// Two Sum Solution
function twoSum(nums, target) {
  const numMap = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (numMap.has(complement)) {
      return [numMap.get(complement), i];
    }
    
    numMap.set(nums[i], i);
  }
  
  return []; // No solution found
}`);

  const languages = ["JavaScript", "Python", "Java", "C++", "TypeScript"];

  return (
    <div className="bg-gray-900 text-white min-h-screen flex">
      {/* Left Sidebar - Problem Description */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-700">
        {/* Problem Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold">
              {problem.id}. {problem.title}
            </span>
            <span
              className={`
              px-2 py-1 rounded-md text-sm font-semibold
              ${
                problem.difficulty === "Easy"
                  ? "bg-green-600/20 text-green-400"
                  : problem.difficulty === "Medium"
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "bg-red-600/20 text-red-400"
              }
            `}
            >
              {problem.difficulty}
            </span>
            {problem.solved && <CheckCircle className="text-green-500" />}
          </div>
          <div className="flex space-x-2">
            <button className="hover:bg-gray-700 p-2 rounded">
              <Share2 size={20} />
            </button>
            <button className="hover:bg-gray-700 p-2 rounded">
              <Star size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-700 mb-4">
          {["Description", "Editorial", "Solutions", "Submissions"].map(
            (tab) => (
              <button
                key={tab}
                className={`py-2 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-white"
                    : "text-gray-400"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            )
          )}
          <button className="ml-auto hover:bg-gray-700 p-2 rounded">
            <Maximize size={20} />
          </button>
        </div>

        {/* Problem Description Content */}
        <div>
          <p className="mb-4">{problem.description}</p>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Examples:</h3>
            {problem.examples.map((example, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-md mb-2">
                <p>
                  <strong>Input:</strong> {example.input}
                </p>
                <p>
                  <strong>Output:</strong> {example.output}
                </p>
                <p>
                  <strong>Explanation:</strong> {example.explanation}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Constraints:</h3>
            <ul className="list-disc list-inside">
              {problem.constraints.map((constraint, index) => (
                <li key={index} className="text-gray-300">
                  {constraint}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Related Topics:</h3>
            <div className="flex space-x-2">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-800 px-2 py-1 rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Coding Area */}
      <div className="w-1/2 flex flex-col">
        {/* Coding Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <span>|</span>
            <div className="flex space-x-2">
              <button className="flex items-center space-x-1 bg-gray-800 px-3 py-2 rounded-md">
                <Code size={16} /> <span>Code</span>
              </button>
              <button className="flex items-center space-x-1 bg-gray-800 px-3 py-2 rounded-md">
                <FileText size={16} /> <span>Testcase</span>
              </button>
              <button className="flex items-center space-x-1 bg-gray-800 px-3 py-2 rounded-md">
                <BookOpen size={16} /> <span>Test Result</span>
              </button>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-md">
              <Play size={16} /> <span>Run</span>
            </button>
            <button className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-md">
              <CloudUpload size={16} /> <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-grow p-4">
          <textarea
            className="w-full h-full bg-gray-800 text-white p-4 font-mono text-sm rounded-md"
            value={editorCode}
            onChange={(e) => setEditorCode(e.target.value)}
          />
        </div>

        {/* Test Cases */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex space-x-2 mb-2">
            <button className="bg-gray-800 px-3 py-1 rounded-md">Case 1</button>
            <button className="bg-gray-800 px-3 py-1 rounded-md">Case 2</button>
            <button className="bg-gray-800 px-3 py-1 rounded-md">Case 3</button>
            <button className="bg-gray-800 px-3 py-1 rounded-md">+</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">nums =</label>
              <input
                type="text"
                defaultValue="[2,7,11,15]"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-2">target =</label>
              <input
                type="text"
                defaultValue="9"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
