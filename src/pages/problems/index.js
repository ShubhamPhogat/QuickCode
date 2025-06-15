import React, { useEffect, useState } from "react";
import { Search, Lock, CheckCircle2, Circle, Shuffle } from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";

const DifficultyBadge = ({ difficulty }) => {
  const styles = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[difficulty.toLowerCase()] || styles.medium
      }`}
    >
      {difficulty}
    </span>
  );
};

const ProblemList = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [problems, setProblems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    setIsClient(true);
    fetchAllProblems();
  }, []);

  const generateRandomQues = () => {
    if (problems.length === 0) return;

    setSelectedDifficulty("All");
    setSearchTerm("");

    // Get filtered problems or all problems if no filters
    const availableProblems = problems.filter((prob) => {
      return (
        (selectedDifficulty === "All" ||
          prob.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()) &&
        (searchTerm === "" ||
          prob.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    const problemsToChooseFrom =
      availableProblems.length > 0 ? availableProblems : problems;
    const randomProblem =
      problemsToChooseFrom[
        Math.floor(Math.random() * problemsToChooseFrom.length)
      ];

    if (randomProblem) {
      router.push(`/problems/${randomProblem._id}`);
    }
  };

  const fetchAllProblems = async () => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          sessionStorage.setItem("redirectAfterAuth", router.asPath);
          router.push("/auth");
          return;
        }

        const res = await axios.get(
          `https://quickcode.solutions/api/UserProblem`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res && res.data) {
          setProblems(
            res.data.data.map((prob, index) => ({
              ...prob,
              id: index + 1,
            }))
          );
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          sessionStorage.setItem("redirectAfterAuth", router.asPath);
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

  const filteredProblems = problems.filter((prob) => {
    return (
      (selectedDifficulty === "All" ||
        prob.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()) &&
      (searchTerm === "" ||
        prob.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (!isClient) {
    return (
      <div className="bg-[#0a0a0a] text-white min-h-screen p-6 flex items-center justify-center">
        <div className="animate-pulse text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] text-gray-200 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Problems
          </h1>
          <p className="text-gray-400">
            Enhance your skills, expand your knowledge and prepare for technical
            interviews.
          </p>
        </div>

        {/* Topics Pills */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button className="px-4 py-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-all duration-200">
            All Topics
          </button>
          <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200">
            Arrays
          </button>
          <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200">
            Strings
          </button>
          <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200">
            Dynamic Programming
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-gray-800">
          <div className="flex items-center gap-4 flex-wrap">
            <select className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-colors">
              <option>Lists</option>
            </select>

            <select
              className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-colors"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="All">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-colors">
              <option>Status</option>
              <option>Solved</option>
              <option>Attempted</option>
              <option>Todo</option>
            </select>

            <select className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-colors">
              <option>Tags</option>
            </select>

            {/* Search Bar */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search problems..."
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-300 placeholder-gray-500 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
            </div>

            <button
              onClick={generateRandomQues}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <Shuffle size={18} />
              Pick Random
            </button>
          </div>
        </div>

        {/* Problem Table */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-gray-800">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Title
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Solution
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Acceptance
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Difficulty
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length > 0 ? (
                filteredProblems.map((problem, index) => (
                  <tr
                    key={problem._id}
                    className={`border-b border-gray-800 transition-all duration-200 ${
                      hoveredRow === index ? "bg-purple-600/5" : ""
                    }`}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="py-4 px-6">
                      {problem.solved ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <Circle size={20} className="text-gray-600" />
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => navigate(problem._id)}
                        className="text-left hover:text-purple-400 transition-colors duration-200"
                      >
                        <span className="text-gray-500 mr-2">
                          {problem.id}.
                        </span>
                        <span className="font-medium">{problem.title}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <Lock size={16} className="text-gray-600" />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-400">
                        {problem.acceptance || 0}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: "30%" }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-gray-500">
                        <Search size={48} className="opacity-20" />
                      </div>
                      <p className="text-gray-400 text-lg">No problems found</p>
                      <p className="text-gray-500 text-sm">
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProblems.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {filteredProblems.length} of {problems.length} problems
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-600/30">
                1
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200">
                2
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200">
                3
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600 transition-all duration-200">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Optional: Add some gradient orbs for visual appeal */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default ProblemList;
