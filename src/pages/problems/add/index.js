import Navbar from "@/components/Navbar";
import axios from "axios";
import { useRouter } from "next/router";
import React, { useState } from "react";

// Custom multiselect component for tags
function TagSelector({ tags, selectedTags, onChange, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div
        className={`p-3 border rounded-md cursor-pointer flex flex-wrap gap-2 min-h-12 ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-300"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-1 rounded-full text-sm ${
                isDarkMode
                  ? "bg-blue-900 text-blue-200"
                  : "bg-purple-100 text-purple-800"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleTag(tag);
              }}
            >
              {tag} ×
            </span>
          ))
        ) : (
          <span className="text-gray-500">Select tags...</span>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute z-20 left-0 right-0 mt-1 border rounded-md shadow-lg ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <div className="p-2">
            <input
              type="text"
              className={`w-full p-2 border rounded ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-2">
            {filteredTags.map((tag) => (
              <div
                key={tag}
                className={`p-2 cursor-pointer rounded ${
                  selectedTags.includes(tag)
                    ? isDarkMode
                      ? "bg-blue-900"
                      : "bg-purple-100"
                    : isDarkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTag(tag);
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddProblemForm() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Assume admin is logged in
  const [isAdmin, setIsAdmin] = useState(true); // For demo

  // Form states
  const [title, settitle] = useState("");
  const [description, setdescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [constraints, setConstraints] = useState("");
  const [testCases, setTestCases] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const availableTags = [
    "Dynamic Programming",
    "Greedy",
    "Graph",
    "LinkedList",
    "Stack",
    "Heap",
    "BFS",
    "DFS",
    "Array",
    "Number Theory",
    "String",
    "Bit Manipulation",
    "Advanced Data Structure",
    "Two Pointers",
    "Binary Search",
    "Recursion",
    "Backtracking",
    "Math",
    "Sorting",
    "Hash Table",
    "Tree",
    "Binary Tree",
  ];

  const typingTexts = [
    'cout << "Hello World";',
    'print("Hello World")',
    'System.out.println("Hello World");',
    'console.log("Hello World");',
  ];

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({
      title,
      description,
      difficulty,
      constraints,
      testCases,
      selectedTags,
    });

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth");
      }

      const res = await axios.post(
        "http://localhost:3000/api/problem/add",
        {
          title,
          description,
          difficulty,
          constraints,
          testCases,
          tags: selectedTags,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res);

      alert("Problem submitted successfully!");
    } catch (error) {
      alert("error in adding problem please try again");
    }
  };

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-purple-50 text-black"
      }`}
    >
      {/* Background code effect for bottom right corner */}

      <Navbar
        isLoggedIn={isLoggedIn}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-8 ${
              darkMode ? "text-blue-400" : "text-purple-600"
            }`}
          >
            Add New Problem
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className={`p-6 rounded-lg shadow-md ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Problem Title */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">Problem Title</label>
                <input
                  type="text"
                  className={`w-full p-3 rounded-md border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Enter problem title"
                  value={title}
                  onChange={(e) => settitle(e.target.value)}
                  required
                />
              </div>

              {/* Problem Description */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  Problem Description
                </label>
                <textarea
                  className={`w-full p-3 rounded-md border min-h-32 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Describe the problem in detail..."
                  value={description}
                  onChange={(e) => setdescription(e.target.value)}
                  required
                />
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  Difficulty Level
                </label>
                <div className="flex flex-wrap gap-4">
                  {["easy", "medium", "hard"].map((level) => (
                    <label
                      key={level}
                      className={`flex items-center cursor-pointer p-3 border rounded-md ${
                        difficulty === level
                          ? darkMode
                            ? "bg-blue-900 border-blue-700"
                            : "bg-purple-100 border-purple-500"
                          : darkMode
                          ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        checked={difficulty === level}
                        onChange={() => setDifficulty(level)}
                        className="hidden"
                      />
                      <span
                        className={`capitalize ${
                          level === "easy"
                            ? "text-green-500"
                            : level === "medium"
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {level === "easy" && "• "}
                        {level === "medium" && "•• "}
                        {level === "hard" && "••• "}
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">Constraints</label>
                <textarea
                  className={`w-full p-3 rounded-md border min-h-24 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Add problem constraints..."
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                />
              </div>

              {/* Test Cases */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">Test Cases</label>
                <textarea
                  className={`w-full p-3 rounded-md border min-h-36 font-mono text-sm ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Input:\n1 2 3 4 5\nOutput:\n15"
                  value={testCases}
                  onChange={(e) => setTestCases(e.target.value)}
                  required
                />
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">Tags</label>
                <TagSelector
                  tags={availableTags}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  isDarkMode={darkMode}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-md text-white font-medium ${
                    darkMode
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  Add Problem
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Code typing animation as a background element */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
        <div className="font-mono text-lg md:text-xl lg:text-2xl text-left">
          {/* The typing animation would go here */}
        </div>
      </div>

      {/* Mobile menu - hamburger for smaller screens */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <button
          className={`p-3 rounded-full shadow-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          ☰
        </button>
      </div>
    </div>
  );
}
