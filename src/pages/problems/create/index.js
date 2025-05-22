import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import CodeEditor from "@/components/CodeEditor";
import Loader from "@/components/Loader";
import axios from "axios";
import ReactConfetti from "react-confetti";
import { useRouter } from "next/router";

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
  const [problemUrl, setProblemUrl] = useState("");
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
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth");
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/problem/generate`,
        { problem, constraints, hint },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSolution(response.data);
      setCodeValue(response.data.code);
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
  };

  async function generateTestCase() {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth");
      }
      setGeneratingTestLoader(true);
      const tests = await axios.post(
        `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/problem/generate/tests`,
        {
          code: codeValue,
          problem,
          constraint: constraints,
          recruiterQuestion: isToggled,
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
    <div className="min-h-screen bg-[#0f172a] dark:bg-[#0f172a] transition-colors duration-300 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[#1e293b] rounded-tl-[50%] opacity-50 z-0"></div>

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
          className="px-5 py-2 rounded-full bg-gray-800 text-white font-medium transition-colors duration-300 flex items-center"
        >
          {theme === "dark" ? (
            <>
              <span className="mr-2">☀️</span> Light Mode
            </>
          ) : (
            <>
              <span className="mr-2">🌙</span> Dark Mode
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
            className="text-6xl text-blue-400 mb-8"
          >
            Welcome
          </motion.h1>

          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-3xl text-white mb-8"
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
              className="text-lg leading-relaxed px-4"
            />
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-8 relative"
          >
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Enter your problem..."
              className="w-full px-6 py-4 rounded-full bg-[#1e293b]/80 text-gray-200 border border-blue-500/20 focus:outline-none focus:border-blue-500/40 transition-colors duration-300"
            />
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-8 relative"
          >
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="Providing constraints would be useful to generate optimal code..."
              className="w-full px-6 py-4 rounded-full bg-[#1e293b]/80 text-gray-200 border border-blue-500/20 focus:outline-none focus:border-blue-500/40 transition-colors duration-300"
            />
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="w-full max-w-2xl mx-auto mb-8 relative"
          >
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Providing hints would be useful to generate optimal code..."
              className="w-full px-6 py-4 rounded-full bg-[#1e293b]/80 text-gray-200 border border-blue-500/20 focus:outline-none focus:border-blue-500/40 transition-colors duration-300"
            />
          </motion.div>

          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            onClick={handleGenerateSolution}
            disabled={loading}
            className="px-8 py-3 rounded-full bg-[#1e293b] hover:bg-[#263548] text-white font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
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
            className="mb-8 px-5 py-2 rounded-full bg-[#1e293b] text-white hover:bg-[#263548] transition-colors duration-300"
          >
            ← Back to Problem
          </motion.button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mb-10 p-6 bg-[#1e293b] rounded-lg border border-blue-500/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">
              Explanation
            </h3>
            <p className="text-gray-300">{solution.explanation}</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mb-10"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">
              Solution Code
            </h3>
            <CodeEditor code={codeValue} setCode={setCodeValue} />
          </motion.div>
          <p>
            <h2 className="text-amber-500 font-bold"> Note</h2>
            Are You a Recruiter ? , If you are a recruiter it is recommended to
            check this , in order to keep the question private to you .
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isToggled}
              onChange={handleToggle}
              className="hidden"
            />
            <div
              className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 ${
                isToggled ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                  isToggled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
            <span>{isToggled ? "ON" : "OFF"}</span>
          </label>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            onClick={generateTestCase}
            disabled={generatingTestLoader}
            className="px-6 py-3 rounded-full bg-blue-600/80 hover:bg-blue-700/80 text-white font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-700/50 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {generatingTestLoader ? (
              <Loader className="mr-2" />
            ) : (
              " Auto Generate Test Cases"
            )}
          </motion.button>

          {problemUrl && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="mt-8 p-6 bg-[#1e293b] rounded-lg border border-blue-500/20"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">
                Test Cases Generated Successfully!
              </h3>
              <div className="flex items-center mb-2">
                <p className="text-gray-300 mr-2">Your problem URL:</p>
                <a
                  href={problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  {problemUrl}
                </a>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(problemUrl);
                  alert("URL copied to clipboard!");
                }}
                className="mt-2 px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors duration-300 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
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
