import React, { useEffect, useState } from "react";
import { Search, Lock } from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";

const problems = [
  {
    id: 3394,
    title: "Check if Grid can be Cut into Sections",
    difficulty: "Medium",
    acceptance: 62.5,
    solved: false,
  },
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    acceptance: 55.2,
    solved: true,
  },
  {
    id: 2,
    title: "Add Two Numbers",
    difficulty: "Medium",
    acceptance: 45.6,
    solved: true,
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    acceptance: 36.4,
    solved: true,
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    acceptance: 43.1,
    solved: true,
  },
  {
    id: 5,
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    acceptance: 35.4,
    solved: true,
  },
  {
    id: 6,
    title: "Zigzag Conversion",
    difficulty: "Medium",
    acceptance: 50.9,
    solved: false,
  },
];

const DifficultyBadge = ({ difficulty }) => {
  const colorMap = {
    Easy: "text-green-600",
    Medium: "text-yellow-600",
    Hard: "text-red-600",
  };

  return (
    <span className={`font-semibold ${colorMap[difficulty]}`}>
      {difficulty}
    </span>
  );
};

const ProblemList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics] = useState(["All Topics"]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [randomIndex, setrandomIndex] = useState(-1);
  const Router = useRouter();

  var filteredProblems = problems.filter((prob) => {
    return (
      (prob.difficulty === selectedDifficulty ||
        selectedDifficulty === "All") &&
      (searchTerm === "" ||
        prob.title
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase())) &&
      (randomIndex === -1 || prob.id === randomIndex)
    );
  });

  const generateRandomQues = () => {
    setSelectedDifficulty("All");
    setSearchTerm("");
    const randomIndex = Math.floor(Math.random() * problems.length);
    console.log(randomIndex);
    setrandomIndex(randomIndex);
  };

  const fetchAllProblems = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_API_FRONTEND_PROBLEM}/api/problem/get`
      );
    } catch (error) {}
  };

  useEffect(() => {
    fetchAllProblems();
  }, []);

  const navigate = (id) => {
    Router.push(`/problems/${id}`);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="container mx-auto">
        {/* Header with Topics */}
        <div className="flex items-center space-x-4 mb-6">
          <button className="bg-white text-black px-4 py-2 rounded-md">
            All Topics
          </button>
          {["Algorithms", "Database", "Shell", "Concurrency", "JavaScript"].map(
            (topic) => (
              <button
                key={topic}
                className="text-gray-300 hover:text-white px-4 py-2 rounded-md"
              >
                {topic}
              </button>
            )
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex items-center space-x-4 mb-6">
          <select className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
            <option>Lists</option>
          </select>
          <select
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
            value={selectedDifficulty}
            onChange={(e) => {
              setrandomIndex(-1);
              setSelectedDifficulty(e.target.value);
            }}
          >
            <option value="All">Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
            <option>Status</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
            <option>Tags</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search questions"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-10 py-2"
              value={searchTerm}
              onChange={(e) => {
                setrandomIndex(-1);
                setSearchTerm(e.target.value);
              }}
            />
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          </div>

          <button
            onClick={generateRandomQues}
            className="bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer"
          >
            Pick One
          </button>
        </div>

        {/* Problem Table */}
        <table className="w-full text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Solution</th>
              <th className="py-3 px-4">Acceptance</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem) => (
              <tr
                key={problem.id}
                className="border-b border-gray-700 hover:bg-gray-800"
              >
                <td className="py-3 px-4">{problem.solved ? "✓" : ""}</td>
                <td
                  onClick={() => {
                    navigate(problem.id);
                  }}
                  className="py-3 px-4"
                >
                  {problem.id}. {problem.title}
                </td>
                <td className="py-3 px-4">
                  <Lock size={16} className="text-gray-500" />
                </td>
                <td className="py-3 px-4">{problem.acceptance}%</td>
                <td className="py-3 px-4">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>
                <td className="py-3 px-4">
                  <Lock size={16} className="text-gray-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProblemList;
