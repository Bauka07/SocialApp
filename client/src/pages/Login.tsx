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

  // showForgot only when server says the password is invalid
  const [showForgot, setShowForgot] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // When user types again, clear error and hide forgot link
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
      } else {
        setShowForgot(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <Card className="w-full max-w-sm shadow-[0_5px_15px_rgba(0,0,0,0.35)] bg-gray-50">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Login to your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={handleChange}
                  value={formData.email}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>

                  {showForgot ? (
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-blue-600 underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  ) : (
                    <span className="text-sm invisible">Hidden</span>
                  )}
                </div>

                <Input
                  id="password"
                  type="password"
                  required
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-center">
                <Button type="submit" className="w-[70%]" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button variant="outline" className="w-[70%]">
            Login with Google
          </Button>
          <h4>
            Don't have an account?
            <Button variant="link" onClick={() => navigate("/register")}>
              Sign Up
            </Button>
          </h4>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
