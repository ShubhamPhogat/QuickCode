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
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/router";
import { Toaster, toast } from "react-hot-toast";
import CodeEditor from "@/utils/CodeEditor";

const ProblemDetailPage = () => {
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript");
  const [editorCode, setEditorCode] = useState(`
// Write your solution here
function solve(a, b, c, d) {
  return (a + b + c + d) / 4;
}
  `);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [allTestCase, setAllTestCase] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

  const languages = ["JavaScript", "Python", "Java", "C++", "TypeScript"];

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
  const localStorageKey = `code-editor-${id}`;
  useEffect(() => {
    const savedCode = localStorage.getItem(localStorageKey);
    if (savedCode) {
      setEditorCode(savedCode);
    } else {
      // Set default code if no saved code exists
      setEditorCode(`
// Write your solution here
function solve(a, b, c, d) {
  return (a + b + c + d) / 4;
}
      `);
    }
  }, [localStorageKey]);

  const handleCodeChange = (value) => {
    setEditorCode(value);
    // Save to localStorage whenever code changes
    localStorage.setItem(localStorageKey, value);
    console.log("Code updated and saved:", value);
  };

  const submitCode = async () => {
    if (!wss.current || wss.current.readyState !== WebSocket.OPEN) {
      toast.error("Cannot connect to server");
      return;
    }

    setIsRunning(true);
    toast.loading("Submitting code...", { id: "codeSubmission" });

    wss.current.send(
      JSON.stringify({
        editorCode,
        selectedLanguage,
        problemId: problem?._id,
        testCase: allTestCase,
        all: false,
      })
    );
  };

  const fetchProblemDetails = async (id, RQP) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth");
      }

      let res = null;
      if (RQP === "true") {
        res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/problem/get?id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/UserProblem?id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      console.log(res);
      if (res && res.data) {
        setProblem(res.data._doc);
        setAllTestCase(res.data._doc.testCase);

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
      console.error("Error fetching problem details:", error);
      setProblem(null);
      setTestCases([]);
      toast.error("Failed to load problem details");
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
        wss.current = new WebSocket(
          `${process.env.NEXT_PUBLIC_API_WEBSOCKET_URL}`
        );

        wss.current.onopen = () => {
          console.log("Connected to the server");
        };

        wss.current.onmessage = (event) => {
          const response = JSON.parse(event.data);
          setIsRunning(false);

          if (response.results) {
            setTestResults(response.results);
          }

          if (response.status === 0) {
            toast.error("Compilation error: " + response.msg, {
              id: "codeSubmission",
            });
          } else if (response.status === 1) {
            if (response.allPassed) {
              toast.success("All test cases passed!", { id: "codeSubmission" });
            } else if (response.failedTestCase) {
              toast.error(
                `Test case failed: Expected ${response.failedTestCase.expected}, got ${response.failedTestCase.actual}`,
                { id: "codeSubmission" }
              );
            }
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

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col md:flex-row">
      <Toaster position="top-center" />

      <div className="w-full md:w-1/2 p-4 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-700">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div className="flex items-center space-x-4">
            <span className="text-xl md:text-2xl font-bold truncate">
              {problem._id ? problem._id.substring(0, 6) : "1"}. {problem.title}
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

        <div className="overflow-y-auto max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-150px)] pr-2">
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
            <div>
              <h3 className="font-semibold mb-2">Constraints:</h3>
              <ul className="list-disc list-inside">
                <li className="text-gray-300">{problem.constraints}</li>
              </ul>
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

      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex flex-wrap justify-between items-center p-4 border-b border-gray-700 gap-2">
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <span className="hidden md:inline">|</span>
            <div className="flex space-x-1">
              <button className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded-md text-sm">
                <Code size={14} /> <span>Code</span>
              </button>
              <button className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded-md text-sm">
                <FileText size={14} /> <span>Testcase</span>
              </button>
              <button className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded-md text-sm">
                <BookOpen size={14} /> <span>Test Result</span>
              </button>
            </div>
          </div>
          <button
            onClick={submitCode}
            disabled={isRunning}
            className={`flex items-center space-x-1 ${
              isRunning ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
            } text-white px-4 py-2 rounded-md transition-colors duration-200 w-full md:w-auto mt-2 md:mt-0 justify-center`}
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                <span>Running...</span>
              </>
            ) : (
              <>
                <CloudUpload size={16} /> <span>Submit</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full h-[500px] max-w-4xl mx-auto">
          <CodeEditor
            initialCode={editorCode}
            language="javascript"
            onChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
