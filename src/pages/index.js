import Navbar from "@/components/Navbar";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

// Custom typing animation without external dependencies
function TypedAnimation({ texts, className }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];
    const typeSpeed = isDeleting ? 30 : 70;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText === currentText) {
        // Wait before deleting
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && displayText === "") {
        // Move to next text
        setIsDeleting(false);
        setCurrentIndex((currentIndex + 1) % texts.length);
      } else {
        // Add or remove character
        setDisplayText((prev) => {
          if (isDeleting) {
            return prev.substring(0, prev.length - 1);
          } else {
            return currentText.substring(0, prev.length + 1);
          }
        });
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, currentIndex, isDeleting, texts]);

  return (
    <div className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </div>
  );
}

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const typingTexts = [
    'cout << "Hello World";',
    'print("Hello World")',
    'System.out.println("Hello World");',
    'console.log("Hello World");',
  ];

  const getLocalStorage = () => {
    if (typeof window !== "undefined") {
      return window.localStorage;
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const router = useRouter();

  const logOut = async () => {
    await signOut({ redirect: false });
    const stoarage = getLocalStorage();
    if (Storage) {
      stoarage.removeItem("authToken");
    }
    router.push("/auth");
  };
  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-purple-50 text-black"
      }`}
    >
      {/* Background code effect for bottom right corner */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2">
          <div
            className={`h-full w-full ${
              darkMode ? "bg-gray-800" : "bg-purple-100"
            } rounded-tl-full`}
          ></div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdmin={isAdmin}
        logOut={logOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl  mb-4">
            Explore The
            <br /> Craftmanship of
            <br />
            <span
              className={`${darkMode ? "text-blue-400" : "text-purple-600"}`}
            >
              Classic Coding
            </span>
          </h1>
        </div>
      </main>

      {/* Code typing animation as a background element in center of page */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
        <div className="font-mono text-lg md:text-xl lg:text-2xl text-left">
          <TypedAnimation
            texts={typingTexts}
            className={`${darkMode ? "text-white" : "text-purple-700"}`}
          />
        </div>
      </div>

      {/* Mobile menu - hamburger for smaller screens */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <button
          className={`p-3 rounded-full shadow-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          ☰
        </button>
      </div>
    </div>
  );
}
