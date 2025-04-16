import { useState } from "react";
import { useTheme } from "next-themes";

export default function CodeEditor({ code }) {
  const { theme } = useTheme();

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
      <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Code Editor
        </span>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCodeValue(e.target.value)}
        className="w-full h-96 p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none"
        spellCheck="false"
      />
    </div>
  );
}
