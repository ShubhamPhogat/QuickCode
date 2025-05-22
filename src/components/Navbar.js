"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Navbar({
  darkMode,
  isAdmin,
  isLoggedIn,
  setDarkMode,
  logOut,
}) {
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header
      className={`py-4 px-6 md:px-12 ${
        darkMode ? "bg-gray-800" : "bg-white"
      } shadow-md`}
    >
      <nav className="flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <div className="text-xl font-bold mr-2">
            <span
              className={`${darkMode ? "text-blue-400" : "text-purple-600"}`}
            >
              Quick
            </span>
            <span>Code</span>
          </div>
        </div>

        <div className="hidden md:flex space-x-6 text-sm">
          <a href="#" className="hover:opacity-80">
            Home
          </a>

          <Link href="/problems/create">Create</Link>
          <Link href="/problems">Practice</Link>

          {isAdmin && (
            <a href="#" className="hover:opacity-80">
              Admin
            </a>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 text-yellow-300"
                : "bg-purple-100 text-purple-900"
            }`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={logOut}
            className={`px-4 py-2 rounded-md ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-purple-600 hover:bg-purple-700"
            } text-white`}
          >
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
      </nav>
    </header>
  );
}
