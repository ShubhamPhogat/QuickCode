import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

import Loader from "@/components/Loader";
import axios from "axios";
import ReactConfetti from "react-confetti";
import { useRouter } from "next/router";
import CodeEditor from "@/utils/CodeEditor";

const TypingText = ({ texts, className }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingPaused, setTypingPaused] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];
    let timeout;

    if (!typingPaused) {
      const typeSpeed = isDeleting ? 30 : 70;

      timeout = setTimeout(() => {
        if (!isDeleting) {
          // Typing forward
          if (displayText.length < currentText.length) {
            setDisplayText(currentText.substring(0, displayText.length + 1));
          } else {
            // Finished typing - pause before deleting
            setTypingPaused(true);
            setTimeout(() => {
              setIsDeleting(true);
              setTypingPaused(false);
            }, 1500);
          }
        } else {
          // Deleting
          if (displayText.length > 0) {
            setDisplayText(displayText.substring(0, displayText.length - 1));
          } else {
            // Finished deleting - move to next text
            setIsDeleting(false);
            setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
          }
        }
      }, typeSpeed);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [displayText, currentIndex, isDeleting, typingPaused, texts]);

  return (
    <div className={`${className} text-gray-400 text-center`}>
      {displayText}
      <span className="animate-pulse">|</span>
    </div>
  );
};

export default function Home() {
  const [problem, setProblem] = useState("");
  const [constraints, setConstraints] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingTestLoader, setGeneratingTestLoader] = useState(false);
  const [windowDimension, setWindowDimension] = useState({
    width: 0,
    height: 0,
  });
  const [solution, setSolution] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [codeValue, setCodeValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("C++"); // Default to C++
  const [problemUrl, setProblemUrl] = useState("");
  const [problemTitle, setproblemTitle] = useState("");
  const [mainFunction, setmainFunction] = useState("");
  const [pythonMainFunction, setpythonMainFunction] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const detectSize = () => {
    setWindowDimension({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  const router = useRouter();
  const [isToggled, setIsToggled] = useState(false);

  const handleToggle = () => {
    setIsToggled((prev) => !prev);
  };

  // Language options for the dropdown
  const languageOptions = [
    { value: "C++", label: "C++ 11", fileExt: "cpp" },

    { value: "Python", label: "Python", fileExt: "py" },
  ];

  // Handle code editor changes
  const handleCodeChange = (newCode) => {
    setCodeValue(newCode);
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      window.addEventListener("resize", detectSize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", detectSize);
      }
    };
  }, []);

  // Use useMemo to prevent recreating the array on each render
  const instructionTexts = [
    "Describe the problem you want to solve in clear terms.",
    "A good problem description covers Problem Statement, input and output  ",
    "Be specific about inputs, outputs, and requirements.",
    "Add constraints about possible approaches.",
    "Include any time complexity preferences or constraints.",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to handle confetti timeout
  useEffect(() => {
    let confettiTimer;
    if (showConfetti) {
      confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
    return () => {
      if (confettiTimer) clearTimeout(confettiTimer);
    };
  }, [showConfetti]);

  const handleGenerateSolution = async () => {
    setLoading(true);
    try {
      console.log(selectedLanguage);
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth");
      }
      const response = await axios.post(
        `https://quickcode.solutions/api/problem/generate`,
        {
          problem,
          constraints,
          hint,
          language: selectedLanguage, // Send selected language to backend
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("response get from solution maker ⭐   ", response);
      setSolution(response.data);
      setmainFunction(response.data.mainFunction);
      let completeCode = response.data.code;
      setCodeValue(completeCode);
      setpythonMainFunction(response.data.pythonMainFunction);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            alert("You are not authenticated. Please login again.");
            router.push("/auth");
            return;
          } else if (error.response.status === 301) {
            alert(
              "Your Daily Maximum Limit is reached. Please upgrade your account to continue."
            );
            return;
          } else {
            console.error("API error:", error.response.data);
            alert("An unexpected error occurred.");
          }
        } else {
          console.error("No response from server:", error);
          alert("Server not responding. Please try again later.");
        }
      } else {
        console.error("Unknown error:", error);
        alert("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const resetProblem = () => {
    setSolution(null);
    setProblemUrl(""); // Reset the URL when going back to the problem page
    setCodeValue(""); // Clear the code editor
  };

  async function generateTestCase() {
    try {
      console.log("gicing main func", mainFunction);
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth");
      }
      setGeneratingTestLoader(true);
      const tests = await axios.post(
        `https://quickcode.solutions/api/problem/generate/tests`,
        {
          code: codeValue,
          problem,
          constraint: constraints,
          language: selectedLanguage, // Send selected language
          recruiterQuestion: isToggled,
          mainFunction,
          pythonMainFunction,
          title: problemTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGeneratingTestLoader(false);
      if (tests.status === 200) {
        setProblemUrl(tests.data.url);
        setShowConfetti(true); // Trigger confetti
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            alert("You are not authenticated. Please login again.");
            router.push("/auth");
            return;
          } else if (error.response.status === 301) {
            alert(
              "Your Daily Maximum Limit is reached. Please upgrade your account to continue."
            );
            return;
          } else {
            console.error("API error:", error.response.data);
            alert("An unexpected error occurred.");
          }
        } else {
          console.error("No response from server:", error);
          alert("Server not responding. Please try again later.");
        }
      } else {
        console.error("Unknown error:", error);
        alert("An unexpected error occurred.");
      }
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {showConfetti && (
        <ReactConfetti
          width={windowDimension.width}
          height={windowDimension.height}
          recycle={false}
          numberOfPieces={200}
          tweenDuration={1000}
        />
      )}

      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleTheme}
          className="px-5 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-gray-300 font-medium hover:border-purple-600/50 transition-all duration-200 flex items-center gap-2"
        >
          {theme === "dark" ? (
            <>
              <span>☀️</span> Light Mode
            </>
          ) : (
            <>
              <span>🌙</span> Dark Mode
            </>
          )}
        </button>
      </div>

      {!solution ? (
        <div className="flex flex-col items-center min-h-screen pt-24 px-6 relative z-10">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8"
          >
            Welcome
          </motion.h1>

          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-3xl text-gray-200 mb-8"
          >
            Craft Your Own Problem
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="w-full max-w-2xl mb-12 min-h-[120px] flex items-center justify-center"
          >
            <TypingText
              texts={instructionTexts}
              className="text-lg leading-relaxed px-4 text-gray-300"
            />
          </motion.div>

          {/* Language Selection */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-6"
          >
            <label className="block text-gray-400 text-sm font-medium mb-3">
              Select Programming Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="w-full px-6 py-4 rounded-xl bg-[#1a1a1a] text-gray-300 border border-gray-800 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
            >
              {languageOptions.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-6"
          >
            <input
              type="text"
              value={problemTitle}
              onChange={(e) => setproblemTitle(e.target.value)}
              placeholder="Problem Title..."
              className="w-full px-6 py-4 rounded-xl bg-[#1a1a1a] text-gray-300 placeholder-gray-500 border border-gray-800 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-all duration-200"
            />
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-6"
          >
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Enter your problem..."
              className="w-full px-6 py-4 rounded-xl bg-[#1a1a1a] text-gray-300 placeholder-gray-500 border border-gray-800 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-all duration-200"
            />
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-6"
          >
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="Providing constraints would be useful to generate optimal code..."
              className="w-full px-6 py-4 rounded-xl bg-[#1a1a1a] text-gray-300 placeholder-gray-500 border border-gray-800 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-all duration-200"
            />
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-8"
          >
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Providing hints would be useful to generate optimal code..."
              className="w-full px-6 py-4 rounded-xl bg-[#1a1a1a] text-gray-300 placeholder-gray-500 border border-gray-800 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-all duration-200"
            />
          </motion.div>

          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            onClick={handleGenerateSolution}
            disabled={loading}
            className="px-8 py-3 mb-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader /> : "Generate Solution"}
          </motion.button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-6 py-24 relative z-10"
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={resetProblem}
            className="mb-8 px-5 py-2.5 rounded-lg bg-[#1a1a1a] text-gray-300 border border-gray-800 hover:border-purple-600/50 transition-all duration-200"
          >
            ← Back to Problem
          </motion.button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mb-10 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800"
          >
            <h3 className="text-xl font-semibold mb-4 text-purple-400">
              Explanation
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {solution.explanation}
            </p>
          </motion.div>

          {/* Language Selector in Solution View */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-400">
                Solution Code
              </h3>
              <div className="flex items-center space-x-4">
                <label className="text-gray-400 text-sm font-medium">
                  Language:
                </label>
                <select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-300 border border-gray-800 hover:border-purple-600/50 focus:border-purple-600 focus:outline-none transition-all duration-200"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Professional Code Editor */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mb-10 h-96 rounded-xl overflow-hidden border border-gray-800"
          >
            <CodeEditor
              initialCode={codeValue}
              language={selectedLanguage}
              onChange={handleCodeChange}
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mb-8 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800"
          >
            <h2 className="text-amber-400 font-bold mb-3">Note</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Are you a recruiter? If you are a recruiter, it is recommended to
              check this option to keep the question private to you.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isToggled}
                onChange={handleToggle}
                className="hidden"
              />
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                  isToggled ? "bg-purple-600" : "bg-gray-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isToggled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-gray-300 font-medium">
                {isToggled ? "ON" : "OFF"}
              </span>
            </label>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            onClick={generateTestCase}
            disabled={generatingTestLoader}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generatingTestLoader ? (
              <>
                <Loader className="w-5 h-5" />
                <span>Generating...</span>
              </>
            ) : (
              "Auto Generate Test Cases"
            )}
          </motion.button>

          {problemUrl && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="mt-8 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <h3 className="text-xl font-semibold text-green-400">
                  Test Cases Generated Successfully!
                </h3>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-sm mb-2">Your problem URL:</p>
                <a
                  href={problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline transition-colors break-all"
                >
                  {problemUrl}
                </a>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(problemUrl);
                  alert("URL copied to clipboard!");
                }}
                className="px-4 py-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-all duration-200 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy URL
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
