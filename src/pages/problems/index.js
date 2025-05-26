import React, { useEffect, useState } from "react";
import { Search, Lock } from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";

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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics] = useState(["All Topics"]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [problems, setProblems] = useState([]);
  const [randomIndex, setRandomIndex] = useState(-1);
  const [isClient, setIsClient] = useState(false);

  // Fix 1: Use a single router instance
  // Fix 2: Add client-side check with useEffect
  useEffect(() => {
    setIsClient(true);
    fetchAllProblems();
  }, []);

  const generateRandomQues = () => {
    setSelectedDifficulty("All");
    setSearchTerm("");
    const randomIndex = Math.floor(Math.random() * problems.length);
    setRandomIndex(randomIndex);
  };

  const fetchAllProblems = async () => {
    // Fix 3: Move localStorage access inside useEffect
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          router.push("/auth");
          return;
        }

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/UserProblem`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(res.data.data);

        if (res && res.data) {
          setProblems(res.data.data);
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          router.push("/auth");
        } else {
          console.error("Unexpected error:", error);
        }
      }
    }
  };

  const navigate = (id) => {
    router.push(`/problems/${id}`);
  };

  // Fix 4: Calculate filtered problems within render
  const filteredProblems = problems.filter((prob) => {
    return (
      (prob.difficulty === selectedDifficulty ||
        selectedDifficulty === "All") &&
      (searchTerm === "" ||
        prob.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (randomIndex === -1 || prob.id === randomIndex)
    );
  });

  // Fix 5: Handle SSR/CSR mismatch with conditional rendering
  if (!isClient) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-6">Loading...</div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="container mx-auto">
        {/* Header with Topics */}
        <div className="flex items-center space-x-4 mb-6">
          <button className="bg-white text-black px-4 py-2 rounded-md">
            All Topics
          </button>
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
              setRandomIndex(-1);
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
                setRandomIndex(-1);
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
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => (
                <tr
                  key={problem.id}
                  className="border-b border-gray-700 hover:bg-gray-800"
                >
                  <td className="py-3 px-4">{problem.solved ? "✓" : ""}</td>
                  <td
                    onClick={() => navigate(problem._id)}
                    className="py-3 px-4 cursor-pointer"
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
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-3 px-4 text-center">
                  No problems to show
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProblemList;
