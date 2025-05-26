"use client";

import React, { useState, useRef, useEffect } from "react";

const CodeEditor = ({
  initialCode = "",
  language = "javascript",
  onChange,
}) => {
  const editorRef = useRef(null);
  const codeMirrorRef = useRef(null);
  const [theme, setTheme] = useState("dracula");
  const [fontSize, setFontSize] = useState(14);
  const [isCodeMirrorReady, setIsCodeMirrorReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getLanguageMode = (lang) => {
    const modes = {
      javascript: "javascript",
      js: "javascript",
      jsx: "jsx",
      typescript: "text/typescript-jsx",
      ts: "text/typescript",
      python: "python",
      py: "python",
      cpp: "text/x-c++src",
      c: "text/x-csrc",
      java: "text/x-java",
      html: "htmlmixed",
      css: "css",
    };
    return modes[lang.toLowerCase()] || "javascript";
  };

  // Use useEffect to load CodeMirror only on client side
  useEffect(() => {
    setMounted(true);

    // Dynamic imports for CodeMirror and its addons/modes
    const loadCodeMirror = async () => {
      try {
        const CodeMirror = await import("codemirror").then(
          (module) => module.default || module
        );

        // Import CSS - using require instead of import for CSS files
        require("codemirror/lib/codemirror.css");
        require("codemirror/theme/dracula.css");
        require("codemirror/theme/material.css");
        require("codemirror/theme/monokai.css");

        // Import language modes
        require("codemirror/mode/javascript/javascript");
        require("codemirror/mode/python/python");
        require("codemirror/mode/clike/clike");
        require("codemirror/mode/htmlmixed/htmlmixed");
        require("codemirror/mode/css/css");
        require("codemirror/mode/jsx/jsx");

        // Import addons
        require("codemirror/addon/edit/closebrackets");
        require("codemirror/addon/edit/closetag");
        require("codemirror/addon/edit/matchbrackets");
        require("codemirror/addon/hint/show-hint");
        require("codemirror/addon/hint/show-hint.css");
        require("codemirror/addon/hint/javascript-hint");
        require("codemirror/addon/hint/html-hint");
        require("codemirror/addon/hint/css-hint");
        require("codemirror/addon/selection/active-line");
        require("codemirror/addon/fold/foldcode");
        require("codemirror/addon/fold/foldgutter");
        require("codemirror/addon/fold/foldgutter.css");
        require("codemirror/addon/fold/brace-fold");
        require("codemirror/addon/fold/comment-fold");
        require("codemirror/addon/fold/indent-fold");

        if (editorRef.current && !codeMirrorRef.current) {
          codeMirrorRef.current = CodeMirror(editorRef.current, {
            value: initialCode,
            mode: getLanguageMode(language),
            theme: theme,
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            autoCloseTags: true,
            matchBrackets: true,
            styleActiveLine: true,
            tabSize: 2,
            indentWithTabs: false,
            smartIndent: true,
            extraKeys: {
              "Ctrl-Space": "autocomplete",
              Tab: (cm) => {
                if (cm.somethingSelected()) {
                  cm.indentSelection("add");
                } else {
                  cm.replaceSelection("  ");
                }
              },
            },
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          });

          // Fix #1: Ensure code changes are properly captured
          codeMirrorRef.current.on("change", (instance) => {
            const newValue = instance.getValue();
            if (onChange) {
              onChange(newValue);
            }
          });

          codeMirrorRef.current.setSize("100%", "100%");

          // Make sure we have the latest initial code in the editor
          if (initialCode) {
            codeMirrorRef.current.setValue(initialCode);
          }
        }

        setIsCodeMirrorReady(true);
      } catch (error) {
        console.error("Error loading CodeMirror:", error);
      }
    };

    if (mounted) {
      loadCodeMirror();
    }

    // Clean up CodeMirror instance when component unmounts
    return () => {
      if (codeMirrorRef.current) {
        // No direct "destroy" method in CodeMirror, so we clean up manually
        const wrapper = codeMirrorRef.current.getWrapperElement();
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
        codeMirrorRef.current = null;
      }
    };
  }, [mounted]);

  // Update editor with initialCode when it changes
  useEffect(() => {
    if (codeMirrorRef.current && isCodeMirrorReady && initialCode) {
      const currentValue = codeMirrorRef.current.getValue();
      if (currentValue !== initialCode) {
        codeMirrorRef.current.setValue(initialCode);
      }
    }
  }, [initialCode, isCodeMirrorReady]);

  // Update language mode when it changes
  useEffect(() => {
    if (codeMirrorRef.current && isCodeMirrorReady) {
      codeMirrorRef.current.setOption("mode", getLanguageMode(language));
    }
  }, [language, isCodeMirrorReady]);

  // Update theme when it changes
  useEffect(() => {
    if (codeMirrorRef.current && isCodeMirrorReady) {
      codeMirrorRef.current.setOption("theme", theme);
    }
  }, [theme, isCodeMirrorReady]);

  // Update font size when it changes
  useEffect(() => {
    if (editorRef.current && isCodeMirrorReady) {
      const cmElements = editorRef.current.getElementsByClassName("CodeMirror");
      if (cmElements.length > 0) {
        cmElements[0].style.fontSize = `${fontSize}px`;
      }
    }
  }, [fontSize, isCodeMirrorReady]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleFontSizeChange = (size) => {
    setFontSize((prevSize) => {
      const newSize = prevSize + size;
      return Math.min(Math.max(newSize, 10), 24); // Limit font size between 10px and 24px
    });
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden shadow-lg">
      {mounted && (
        <>
          <div className="flex justify-between items-center px-3 py-2 bg-gray-900 border-b border-gray-700 h-10">
            <select
              value={theme}
              onChange={handleThemeChange}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="dracula">Dracula</option>
              <option value="material">Material</option>
              <option value="monokai">Monokai</option>
            </select>
            <div className="flex items-center">
              <button
                onClick={() => handleFontSizeChange(-1)}
                className="bg-gray-700 text-white rounded w-6 h-6 flex items-center justify-center hover:bg-gray-600"
              >
                -
              </button>
              <span className="text-gray-300 mx-2 min-w-10 text-center text-sm">
                {fontSize}px
              </span>
              <button
                onClick={() => handleFontSizeChange(1)}
                className="bg-gray-700 text-white rounded w-6 h-6 flex items-center justify-center hover:bg-gray-600"
              >
                +
              </button>
            </div>
          </div>
          <div
            ref={editorRef}
            className="w-full h-full flex-grow overflow-hidden"
          />
        </>
      )}

      <style jsx global>{`
        .CodeMirror {
          height: 100% !important;
          font-family: "JetBrains Mono", "Fira Code", "Source Code Pro",
            "Monaco", monospace;
          font-feature-settings: "calt" 1;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .CodeMirror-linenumber {
          font-family: "JetBrains Mono", "Fira Code", monospace;
        }

        /* Add custom syntax highlighting enhancements */
        .CodeMirror .cm-keyword {
          font-weight: bold;
        }

        .CodeMirror .cm-comment {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;
