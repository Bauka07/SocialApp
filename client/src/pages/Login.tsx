import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";

type LoginRequest = {
  email: string;
  password: string;
};

type ApiError = {
  error: string;
};

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: number;
  };
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setError(null);
    setShowForgot(false);

    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowForgot(false);

    try {
      const response = await axios.post<LoginResponse>(
        "http://26.176.162.130:8080/users/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { token } = response.data;
      localStorage.setItem("token", token);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const serverMsg =
        axiosErr.response?.data?.error ||
        axiosErr.response?.statusText ||
        axiosErr.message ||
        "Something went wrong.";

      setError(serverMsg);
      const lower = serverMsg.toLowerCase();
      const passwordErrorDetected =
        lower.includes("invalid password") ||
        lower.includes("incorrect password") ||
        lower.includes("wrong password") ||
        (lower.includes("invalid credentials") && lower.includes("password")) ||
        (axiosErr.response?.status === 401 &&
          (lower.includes("password") || lower.includes("credentials")));

      if (passwordErrorDetected) {
        setShowForgot(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full py-12 px-4">
      {/* Background decorative elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <Card className="relative w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border-2 border-orange-100 rounded-3xl overflow-hidden z-10">
        {/* Header with logo */}
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">S</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">Sign in to continue to SocApp</p>
        </CardHeader>

        <CardContent className="px-8">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  onChange={handleChange}
                  value={formData.email}
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>

                  {showForgot && (
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  onChange={handleChange}
                  value={formData.password}
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="h-12 mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-4 pb-8 px-8">
          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google button */}
          <Button
            variant="outline"
            className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Sign Up
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;