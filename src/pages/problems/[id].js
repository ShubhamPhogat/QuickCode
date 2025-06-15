import React, { useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  Code,
  CheckCircle,
  FileText,
  BookOpen,
  Share2,
  Star,
  AlertCircle,
  Info,
  Terminal,
  Copy,
  Play,
  Plus,
  X,
  Check,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/router";
import { Toaster, toast } from "react-hot-toast";
import CodeEditor from "@/utils/CodeEditor";
import inputGuides from "@/utils/inputGuides";

const ProblemDetailPage = () => {
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedLanguage, setSelectedLanguage] = useState("C++");
  const [editorCode, setEditorCode] = useState("");
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [allTestCase, setAllTestCase] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [showLanguageChangeWarning, setShowLanguageChangeWarning] =
    useState(false);
  const [pendingLanguage, setPendingLanguage] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [exapmleTestcase, setexapmleTestcase] = useState("");

  // Test case section states
  const [activeTestTab, setActiveTestTab] = useState("testcase");

  const languages = ["Python", "C++"];

  // Default code templates for different languages
  const defaultCodeTemplates = {
    Python: `# Write your solution here
def solve():
    # Your code here
    pass

if __name__ == "__main__":
    solve()`,

    "C++": `// Write your solution here
#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
  };

  const wss = useRef(null);
  const router = useRouter();
  const resizeRef = useRef(null);
  const editorContainerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isDragging && editorContainerRef.current) {
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const newHeight = Math.max(200, e.clientY - containerRect.top);
      setEditorHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const { id } = router.query;

  // Copy code to clipboard
  const copyToClipboard = async (code, title) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(title);
      toast.success(`${title} copied to clipboard!`);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  // Get localStorage key for specific language and problem
  const getLocalStorageKey = (language, problemId) => {
    return `code-editor-${problemId}-${language}`;
  };

  // Load code from localStorage for specific language
  const loadCodeForLanguage = (language, problemId, fallbackCode = null) => {
    const key = getLocalStorageKey(language, problemId);
    const savedCode = localStorage.getItem(key);

    if (savedCode) {
      return savedCode;
    }

    return defaultCodeTemplates[language];
  };

  // Save code to localStorage for specific language
  const saveCodeForLanguage = (code, language, problemId) => {
    const key = getLocalStorageKey(language, problemId);
    localStorage.setItem(key, code);
  };

  // Initialize code when problem is loaded
  useEffect(() => {
    if (problem && id) {
      let initialCode;

      // For Python, use the template code from the problem if available
      if (selectedLanguage === "Python" && problem.pythonTemplateCode) {
        initialCode = problem.pythonTemplateCode;
      } else {
        // For other languages or if no Python template, load from localStorage or use default
        initialCode = loadCodeForLanguage(selectedLanguage, id);
      }

      setEditorCode(initialCode);
    }
  }, [problem, id]);

  const handleCodeChange = (value) => {
    setEditorCode(value);
    // Save to localStorage whenever code changes
    if (id) {
      saveCodeForLanguage(value, selectedLanguage, id);
    }
    console.log("Code updated and saved:", value);
  };

  const handleLanguageChange = (newLanguage) => {
    if (newLanguage === selectedLanguage) return;

    // Check if current code has been modified (not empty and not default template)
    const currentCode = editorCode.trim();
    const currentDefault = defaultCodeTemplates[selectedLanguage] || "";
    const hasModifiedCode =
      currentCode && currentCode !== currentDefault.trim();

    if (hasModifiedCode) {
      setPendingLanguage(newLanguage);
      setShowLanguageChangeWarning(true);
    } else {
      // No modified code, switch directly
      switchLanguage(newLanguage);
    }
  };

  const switchLanguage = (newLanguage) => {
    // Save current code before switching
    if (id && editorCode.trim()) {
      saveCodeForLanguage(editorCode, selectedLanguage, id);
    }

    setSelectedLanguage(newLanguage);

    // Load code for new language
    let newCode;
    if (newLanguage === "Python" && problem?.pythonTemplateCode) {
      // Check if there's saved code for Python first
      const savedPythonCode = localStorage.getItem(
        getLocalStorageKey("Python", id)
      );
      newCode = savedPythonCode || problem.pythonTemplateCode;
    } else {
      newCode = loadCodeForLanguage(newLanguage, id);
    }

    setEditorCode(newCode);
    setShowLanguageChangeWarning(false);
    setPendingLanguage("");
  };

  const confirmLanguageChange = () => {
    switchLanguage(pendingLanguage);
  };

  const cancelLanguageChange = () => {
    setShowLanguageChangeWarning(false);
    setPendingLanguage("");
  };

  // Run test cases function
  const runTestCase = async () => {
    if (!wss.current || wss.current.readyState !== WebSocket.OPEN) {
      toast.error("Cannot connect to server");
      return;
    }

    setIsRunning(true);
    setActiveTestTab("result");

    wss.current.send(
      JSON.stringify({
        editorCode,
        selectedLanguage,
        problemId: problem?._id,
        testCase: exapmleTestcase,
        all: false,
        exampleTestCases: true,
      })
    );
  };

  const submitCode = async () => {
    if (!wss.current || wss.current.readyState !== WebSocket.OPEN) {
      toast.error("Cannot connect to server");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Submitting code...", { id: "codeSubmission" });

    wss.current.send(
      JSON.stringify({
        editorCode,
        selectedLanguage,
        problemId: problem?._id,
        testCase: allTestCase,
        all: false,
        exampleTestCases: false,
      })
    );
  };



  //     const token = localStorage.getItem("authToken");
  //     if (!token) {
  //       router.push("/auth");
  //       return;
  //     }

  //     let res = null;
  //     if (RQP === "true") {
  //       res = await axios.get(
  //         `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/problem/get?id=${id}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //     } else {
  //       res = await axios.get(
  //         `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/UserProblem?id=${id}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //     }

  //     if (res && res.data) {
  //       setProblem(res.data._doc);
  //       setAllTestCase(res.data._doc.testCase);
  //       setexapmleTestcase(res.data.testCase);

  //       if (res.data.testCase && res.data.testCase.length > 0) {
  //         const formattedTestCases = formatTestCases(res.data.testCase);
  //         setTestCases(formattedTestCases);
  //       } else if (
  //         res.data._doc.testCase &&
  //         res.data._doc.testCase.length > 0
  //       ) {
  //         const formattedTestCases = formatTestCases(res.data._doc.testCase);
  //         setTestCases(formattedTestCases);
  //       } else {
  //         setTestCases([]);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error fetching problem details:", error);

  //     // Handle 401 specifically
  //     if (error.response?.status === 401) {
  //       router.push("/auth");
  //       return; // Important to return after redirect
  //     }

  //     // Only show toast for non-401 errors
  //     if (error.response?.status !== 401) {
  //       toast.error("Failed to load problem details");
  //     }

  //     setProblem(null);
  //     setTestCases([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchProblemDetails = async (id, RQP) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        sessionStorage.setItem("redirectAfterAuth", router.asPath);

        router.push("/auth");
        return;
      }

      let res = null;
      try {
        if (RQP === "true") {
          res = await axios.get(
            `http://localhost:3000/api/problem/get?id=${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          res = await axios.get(
            `http://localhost:3000/api/UserProblem?id=${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (error) {
        if (error.response?.status === 401) {
          router.push("/auth");
          return null; // Return early to prevent further execution
        }
        throw error; // Re-throw other errors
      }

      // Rest of your success handling code...
      if (res && res.data) {
        setProblem(res.data._doc);
        setAllTestCase(res.data._doc.testCase);
        setexapmleTestcase(res.data.testCase);

        if (res.data.testCase && res.data.testCase.length > 0) {
          const formattedTestCases = formatTestCases(res.data.testCase);
          setTestCases(formattedTestCases);
        } else if (
          res.data._doc.testCase &&
          res.data._doc.testCase.length > 0
        ) {
          const formattedTestCases = formatTestCases(res.data._doc.testCase);
          setTestCases(formattedTestCases);
        } else {
          setTestCases([]);
        }
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        // Only handle non-401 errors
        console.error("Error fetching problem details:", error);
        toast.error("Failed to load problem details");
        setProblem(null);
        setTestCases([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTestCases = (rawTestCases) => {
    return Object.values(rawTestCases)
      .filter(
        (testCase) =>
          typeof testCase === "object" &&
          testCase !== null &&
          !Array.isArray(testCase)
      )
      .map((testCase, index) => {
        let inputValues = testCase.input || [];

        return {
          id: testCase._id || `test-${index}`,
          name: `Test Case ${index + 1}`,
          inputs: inputValues,
          expected: testCase.expected,
          inputDisplay: Array.isArray(inputValues)
            ? inputValues.join(", ")
            : String(inputValues),
        };
      });
  };

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wss.current = new WebSocket(`ws://13.60.242.155:8080`);

        wss.current.onopen = () => {
          console.log("Connected to the server");
        };

        // Fixed WebSocket onmessage handler
        wss.current.onmessage = (event) => {
          const response = JSON.parse(event.data);

          // Capture the current state before updating
          const wasRunning = isRunning;
          const wasSubmitting = isSubmitting;

          setIsRunning(false);
          setIsSubmitting(false);
          console.log("WebSocket response:", response);

          // Handle compilation errors
          if (response.compilationError) {
            toast.error(`Compilation Error: ${response.error}`, {
              id: wasRunning ? "testCaseRun" : "codeSubmission",
              duration: 5000,
            });
            if (response.stderr) {
              console.error("Compilation stderr:", response.stderr);
            }
            return;
          }
          if (response.allPassed === false && response.failedTestCase) {
            toast.error(
              `Wrong answer for ${response.failedTestCase.input} expected ${response.failedTestCase.expected} got ${response.failedTestCase.actual} `
            );
          }

          // Handle runtime errors
          if (response.runtimeError) {
            toast.error(
              `Runtime Error: ${response.error || "Code execution failed"}`,
              {
                id: wasRunning ? "testCaseRun" : "codeSubmission",
                duration: 5000,
              }
            );
            if (response.stderr) {
              console.error("Runtime stderr:", response.stderr);
            }
            return;
          }

          // Handle successful execution
          if (response.success) {
            const resultsToShow =
              response.results || response.generatedResults || [];
            console.log("Setting test results:", resultsToShow);

            // Force update test results and switch tab
            setTestResults(resultsToShow);
            setActiveTestTab("result");

            if (response.allPassed) {
              toast.success("All test cases passed! 🎉", {
                id: wasRunning ? "testCaseRun" : "codeSubmission",
                duration: 3000,
              });
            } else if (resultsToShow.length > 0) {
              const passedCount = resultsToShow.filter((r) => r.passed).length;
              const totalCount = resultsToShow.length;

              if (passedCount === 0) {
                toast.error(`All test cases failed (0/${totalCount})`, {
                  id: wasRunning ? "testCaseRun" : "codeSubmission",
                  duration: 4000,
                });
              } else {
                toast.error(
                  `${
                    totalCount - passedCount
                  } test case(s) failed (${passedCount}/${totalCount} passed)`,
                  {
                    id: wasRunning ? "testCaseRun" : "codeSubmission",
                    duration: 4000,
                  }
                );
              }
            }
          } else {
            toast.error("Code execution failed", {
              id: wasRunning ? "testCaseRun" : "codeSubmission",
            });
          }
        };

        wss.current.onclose = () => {
          setTimeout(() => {
            connectWebSocket();
          }, 1000);
        };
      } catch (error) {
        setTimeout(() => {
          connectWebSocket();
        }, 1000);
      }
    };

    connectWebSocket();

    return () => {
      if (wss?.current && wss.current.readyState === WebSocket.OPEN) {
        wss.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const { id, RQP } = router.query;
      console.log("rqp", RQP, typeof RQP);
      if (id) {
        fetchProblemDetails(id, RQP);
      }
    }
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading problem details...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Problem Not Found</h2>
          <p className="mb-4">
            The problem you are looking for could not be loaded.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentLanguageGuide = inputGuides[selectedLanguage];

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Toaster position="top-center" />

      {/* Language Change Warning Modal */}
      {showLanguageChangeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-yellow-500 mr-2" size={24} />
              <h2 className="text-xl font-bold">Warning</h2>
            </div>
            <p className="mb-6 text-gray-300">
              Changing the language will cause you to lose all your existing
              code for the current language. Your code will be saved and you can
              switch back later to recover it.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmLanguageChange}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex-1"
              >
                Continue
              </button>
              <button
                onClick={cancelLanguageChange}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Panel - Problem Description */}
        <div className="w-full lg:w-1/2 p-4 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-700">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div className="flex items-center space-x-4">
              <span className="text-xl md:text-2xl font-bold truncate">
                {problem._id ? problem._id.substring(0, 6) : "1"}.{" "}
                {problem.title}
              </span>
              <span
                className={`
                px-2 py-1 rounded-md text-sm font-semibold
                ${
                  problem.difficulty?.toLowerCase() === "easy"
                    ? "bg-green-600/20 text-green-400"
                    : problem.difficulty?.toLowerCase() === "medium"
                    ? "bg-yellow-600/20 text-yellow-400"
                    : "bg-red-600/20 text-red-400"
                }
              `}
              >
                {problem.difficulty || "Medium"}
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

          <div className="flex space-x-4 overflow-x-auto border-b border-gray-700 mb-4">
            {["Description", "Editorial", "Solutions", "Submissions"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`py-2 whitespace-nowrap ${
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
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-150px)] pr-2">
            <p className="mb-4">{problem.description}</p>

            {testCases.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Examples:</h3>
                {testCases.slice(0, 3).map((example, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-md mb-2">
                    <p>
                      <strong>Input:</strong> {example.inputDisplay}
                    </p>
                    <p>
                      <strong>Output:</strong> {example.expected}
                    </p>
                    {example.explanation && (
                      <p>
                        <strong>Explanation:</strong> {example.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Constraints:</h3>
                <ul className="list-disc list-inside">
                  <li className="text-gray-300">{problem.constraints}</li>
                </ul>
              </div>
            )}

            {/* Input Guide Section */}
            {currentLanguageGuide && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Terminal className="text-blue-400 mr-2" size={20} />
                    <span className="text-2xl mr-2">
                      {currentLanguageGuide.icon}
                    </span>
                    <h3 className="font-bold text-lg text-blue-400">
                      {currentLanguageGuide.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                    {currentLanguageGuide.description}
                  </p>

                  <div className="space-y-4">
                    {currentLanguageGuide.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-300 flex items-center">
                            <Info className="mr-1" size={16} />
                            {example.title}
                          </h4>
                          <button
                            onClick={() =>
                              copyToClipboard(example.code, example.title)
                            }
                            className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                          >
                            <Copy size={12} />
                            <span>
                              {copiedCode === example.title
                                ? "Copied!"
                                : "Copy"}
                            </span>
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">
                          {example.explanation}
                        </p>
                        <div className="bg-gray-900 border border-gray-600 rounded-md p-3 overflow-x-auto">
                          <pre className="text-sm text-gray-200">
                            <code>{example.code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle
                        className="text-yellow-400 mr-2 mt-0.5 flex-shrink-0"
                        size={16}
                      />
                      <div className="text-sm text-yellow-200">
                        <strong>Pro Tip:</strong>{" "}
                        {selectedLanguage === "Python"
                          ? "Use sys.stdin.readline() for faster input in competitive programming. Remember to strip() to remove newlines."
                          : selectedLanguage === "C++"
                          ? "Add ios_base::sync_with_stdio(false); cin.tie(NULL); for faster I/O in competitive programming."
                          : selectedLanguage === "Java"
                          ? "Scanner is convenient but BufferedReader is faster for large inputs. Don't forget to close Scanner."
                          : selectedLanguage === "JavaScript"
                          ? "For competitive programming, consider reading all input at once and parsing it, rather than line by line."
                          : "Always handle type conversions carefully and consider edge cases in input parsing."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {problem.tags && problem.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Related Topics:</h3>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-800 px-2 py-1 rounded-md text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Top Bar */}
          <div className="flex flex-wrap justify-between items-center p-4 border-b border-gray-700 gap-2">
            <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={runTestCase}
                disabled={isRunning}
                className={`flex items-center space-x-1 ${
                  isRunning ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"
                } text-white px-4 py-2 rounded-md transition-colors duration-200`}
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} /> <span>Run</span>
                  </>
                )}
              </button>
              <button
                onClick={submitCode}
                disabled={isSubmitting}
                className={`flex items-center space-x-1 ${
                  isSubmitting ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
                } text-white px-4 py-2 rounded-md transition-colors duration-200`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload size={16} /> <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <div className="h-[400px] lg:h-[50vh]">
              <CodeEditor
                initialCode={editorCode}
                language={selectedLanguage.toLowerCase()}
                onChange={handleCodeChange}
              />
            </div>

            {/* Test Case Section */}
            <div className="border-t border-gray-700 bg-gray-900 flex-1 min-h-0 flex flex-col">
              {/* Test Case Tabs */}
              <div className="flex border-b border-gray-700">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTestTab === "testcase"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTestTab("testcase")}
                >
                  Testcase
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTestTab === "result"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTestTab("result")}
                >
                  Test Result
                </button>
              </div>

              {/* Test Case Content */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[300px]">
                {activeTestTab === "testcase" && (
                  <div className="space-y-4">
                    {/* Display example test cases */}
                    {testCases.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-300">
                          Example Test Cases:
                        </h3>
                        {testCases.map((testCase, index) => (
                          <div
                            key={index}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm text-blue-400">
                                {testCase.name}
                              </h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-400">Input: </span>
                                <span className="font-mono bg-gray-900 px-2 py-1 rounded text-gray-200">
                                  {testCase.inputDisplay}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Expected Output:{" "}
                                </span>
                                <span className="font-mono bg-gray-900 px-2 py-1 rounded text-gray-200">
                                  {testCase.expected}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        <FileText
                          size={48}
                          className="mx-auto mb-4 opacity-50"
                        />
                        <p>No test cases available</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTestTab === "result" && (
                  <div className="space-y-4">
                    {testResults.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-300">
                          Test Results:
                        </h3>
                        {testResults.map((result, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-3 ${
                              result.passed
                                ? "bg-green-900/20 border-green-500/30"
                                : "bg-red-900/20 border-red-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm flex items-center">
                                {result.passed ? (
                                  <CheckCircle
                                    className="text-green-400 mr-2"
                                    size={16}
                                  />
                                ) : (
                                  <X className="text-red-400 mr-2" size={16} />
                                )}
                                Test Case {index + 1}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  result.passed
                                    ? "bg-green-600 text-white"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                {result.passed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-400">Input: </span>
                                <span className="font-mono bg-gray-900 px-2 py-1 rounded text-gray-200">
                                  {Array.isArray(result.input)
                                    ? result.input.join(", ")
                                    : result.input}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Expected:{" "}
                                </span>
                                <span className="font-mono bg-gray-900 px-2 py-1 rounded text-gray-200">
                                  {result.expected}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Output: </span>
                                <span
                                  className={`font-mono px-2 py-1 rounded ${
                                    result.passed
                                      ? "bg-green-900 text-green-200"
                                      : "bg-red-900 text-red-200"
                                  }`}
                                >
                                  {result.actual || "No output"}
                                </span>
                              </div>
                              {result.error && (
                                <div>
                                  <span className="text-gray-400">Error: </span>
                                  <span className="font-mono bg-red-900 px-2 py-1 rounded text-red-200">
                                    {result.error}
                                  </span>
                                </div>
                              )}
                              {result.executionTime && (
                                <div>
                                  <span className="text-gray-400">
                                    Execution Time:{" "}
                                  </span>
                                  <span className="font-mono bg-gray-900 px-2 py-1 rounded text-gray-200">
                                    {result.executionTime}ms
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        <Terminal
                          size={48}
                          className="mx-auto mb-4 opacity-50"
                        />
                        <p>No test results yet</p>
                        <p className="text-sm mt-2">
                          Run your code to see results here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
