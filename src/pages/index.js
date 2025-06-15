import Navbar from "@/components/Navbar";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { Code2, Terminal, Sparkles, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";

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
      <span className="animate-pulse text-purple-400">|</span>
    </div>
  );
}

export default function LandingPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const storage = getLocalStorage();
    if (storage) {
      storage.removeItem("authToken");
    }
    router.push("/auth");
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-gray-200 overflow-hidden">
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

      {/* Navbar */}
      <nav className="relative z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Code2 className="text-purple-400" size={28} />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                QuickCode
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/home"
                className="text-gray-300 hover:text-purple-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/problems/create"
                className="text-gray-300 hover:text-purple-400 transition-colors"
              >
                Create
              </Link>
              <Link
                href="/problems"
                className="text-gray-300 hover:text-purple-400 transition-colors"
              >
                Practice
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <button className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                    U
                  </button>
                  <button
                    onClick={logOut}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push("/auth")}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Animated badges */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-sm border border-purple-600/30">
                <Sparkles size={14} className="inline mr-1" />
                AI-Powered
              </span>
              <span className="px-3 py-1 rounded-full bg-pink-600/20 text-pink-400 text-sm border border-pink-600/30">
                Modern Platform
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Explore The
              <br />
              Craftmanship of
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Classic Coding
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Master algorithms, solve challenging problems, and elevate your
              programming skills with our intelligent coding platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => router.push("/problems")}
                className="group px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-600/25"
              >
                Start Practicing
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => router.push("/problems/create")}
                className="px-6 py-3 rounded-lg bg-[#1a1a1a] text-gray-300 font-medium border border-gray-700 hover:border-purple-600/50 transition-all duration-200"
              >
                Create Problems
              </button>
            </div>

            {/* Code typing animation */}
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"></div>
              <div className="relative bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <Terminal size={16} className="text-gray-500 ml-auto" />
                </div>
                <div className="font-mono text-lg text-gray-300">
                  <TypedAnimation texts={typingTexts} className="" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <h3 className="text-3xl font-bold text-purple-400 mb-2">
                  500+
                </h3>
                <p className="text-gray-400">Coding Problems</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <h3 className="text-3xl font-bold text-pink-400 mb-2">10k+</h3>
                <p className="text-gray-400">Active Users</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <h3 className="text-3xl font-bold text-blue-400 mb-2">50+</h3>
                <p className="text-gray-400">Companies Trust Us</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0a0a0a] pt-16">
          <div className="p-4 space-y-4">
            <Link
              href="/"
              className="block py-3 text-gray-300 hover:text-purple-400"
            >
              Home
            </Link>
            <Link
              href="/problems/create"
              className="block py-3 text-gray-300 hover:text-purple-400"
            >
              Create
            </Link>
            <Link
              href="/problems"
              className="block py-3 text-gray-300 hover:text-purple-400"
            >
              Practice
            </Link>
            {isLoggedIn ? (
              <button
                onClick={logOut}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
