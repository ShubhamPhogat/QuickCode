import { X, CheckCircle, Mail, Lock } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/router";

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center p-4 mb-4 rounded-lg shadow-lg ${
        type === "success"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5 mr-2" />
      ) : (
        <X className="w-5 h-5 mr-2" />
      )}
      <div className="text-sm font-normal">{message}</div>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Sign In / Sign Up Page
export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({
    name: "",

    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const validateForm = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = "First name is required";

    if (!formData.email) tempErrors.email = "Email is required";
    if (!formData.password) tempErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("hit");
    try {
      console.log("Form Data:", formData);
      if (isSignIn) {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/auth/signin`,
          formData
        );
        if (res) {
          console.log(res.data.content);

          localStorage.setItem("authToken", res.data.content.data.token);
          const redirectPath =
            sessionStorage.getItem("redirectAfterAuth") || "/";
          router.push(redirectPath);
        }
      } else {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_FRONTEND_PROBLEM}/api/auth/signup`,
          formData
        );
        console.log(res.data);

        localStorage.setItem("authToken", res.data.content.data.token);
      }

      setToast({
        show: true,
        message: isSignIn
          ? "Successfully signed in!"
          : "Account created successfully! please Go ahead and login ",
        type: "success",
      });
    } catch (error) {
      console.log("Error caught:", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "Something went wrong";

        if (status === 400) {
          setToast({
            show: true,
            message: "Invalid Credentials",
            type: "error",
          });
        } else if (status === 401) {
          setToast({
            show: true,
            message: "Unauthorized access",
            type: "error",
          });
        } else if (status >= 500) {
          setToast({
            show: true,
            message: "Server error. Please try again later.",
            type: "error",
          });
        } else {
          setToast({
            show: true,
            message: message,
            type: "error",
          });
        }
      } else if (error.request) {
        // Network error - no response received
        setToast({
          show: true,
          message: "Network error. Please check your connection and try again.",
          type: "error",
        });
      } else {
        // Something else happened
        setToast({
          show: true,
          message: "An unexpected error occurred. Please try again.",
          type: "error",
        });
      }
    }
  };

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-gray-900 text-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-700">QuickCode</h1>
          <p className="text-gray-600">Create and solve with friends</p>
        </div>

        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 font-medium ${
              isSignIn
                ? "text-purple-700 border-b-2 border-purple-700"
                : "text-white"
            }`}
            onClick={() => setIsSignIn(true)}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 font-medium ${
              !isSignIn
                ? "text-purple-700 border-b-2 border-purple-700"
                : "text-white"
            }`}
            onClick={() => setIsSignIn(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <div className="grid grid-cols-1 gap-4 mb-4 text-white">
                <div>
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full  p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                    placeholder="John"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-medium mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                className="pl-10 w-full   p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                placeholder="john@example.com"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-medium mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                className="pl-10 w-full   p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                placeholder="••••••••"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            // onClick={handleSubmit}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition duration-300"
          >
            {isSignIn ? "Sign In" : "Create Account"}
          </button>
        </form>

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </div>
    </div>
  );
}
