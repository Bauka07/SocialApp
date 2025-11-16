import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";

type Step = "email" | "verify" | "reset";

type ApiError = {
  error: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://26.176.162.130:8080';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      toast.success("Verification code sent to your email!");
      setStep("verify");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const errorMsg = axiosErr.response?.data?.error || "Failed to send reset code";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Code must be 6 digits");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/auth/verify-reset-code`, { email, code });
      toast.success("Code verified! Set your new password");
      setStep("reset");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const errorMsg = axiosErr.response?.data?.error || "Invalid or expired code";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        code,
        new_password: newPassword,
      });
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const errorMsg = axiosErr.response?.data?.error || "Failed to reset password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4">
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
          step === "email" ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-600"
        }`}>
          1
        </div>
        <div className={`h-1 w-12 transition-all ${
          step !== "email" ? "bg-orange-500" : "bg-gray-300"
        }`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
          step === "verify" ? "bg-orange-500 text-white" : step === "reset" ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-400"
        }`}>
          2
        </div>
        <div className={`h-1 w-12 transition-all ${
          step === "reset" ? "bg-orange-500" : "bg-gray-300"
        }`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
          step === "reset" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"
        }`}>
          3
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen w-full py-12 px-4">
      <div className="fixed top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <Card className="relative w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border-2 border-orange-100 rounded-3xl overflow-hidden z-10">
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl">🔐</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            {step === "email" && "Reset Password"}
            {step === "verify" && "Verify Code"}
            {step === "reset" && "New Password"}
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "verify" && "Enter the 6-digit code sent to your email"}
            {step === "reset" && "Create a strong new password"}
          </p>
        </CardHeader>

        {renderStepIndicator()}

        <CardContent className="px-8">
          {/* Step 1: Email Input */}
          {step === "email" && (
            <form onSubmit={handleRequestReset}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === "verify" && (
            <form onSubmit={handleVerifyCode}>
              <div className="space-y-5">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-orange-800">
                    📧 Code sent to <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-gray-700">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                  />
                  <p className="text-xs text-gray-500 mt-1">Code expires in 15 minutes</p>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  ← Back to email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="pb-8 px-8">
          <p className="text-center text-sm text-gray-600 w-full">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Sign In
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;