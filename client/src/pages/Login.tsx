import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from 'react-router-dom'
import { toast } from "react-toastify"
import axios, { AxiosError } from "axios"

type LoginRequest = {
  email: string;
  password: string;
}

type ApiError = {
  error: string;
}

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: number;
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      navigate("/dashboard")
    }
  }, [navigate])
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setError(null)
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post<LoginResponse>(
        "http://localhost:8080/users/login", 
        formData, 
        {
          headers: {"Content-Type": "application/json",},
        },
      )
      const { token, user } = response.data
      localStorage.setItem("token", token)
      toast.success("Logged in successfully!")
      navigate("/dashboard")
    } catch (err) {
      const error = err as AxiosError<ApiError>
      setError(error.response?.data?.error || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='flex items-center justify-center h-screen w-full'>
      <Card className="w-full max-w-sm shadow-[0_5px_15px_rgba(0,0,0,0.35)] bg-gray-50">
        <CardHeader>
          <CardTitle className='text-3xl text-center'>Login to your account</CardTitle>
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
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required onChange={handleChange} value={formData.password} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className='flex justify-center'>
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
            <h4>Don't have an account?<Button variant="link" onClick={() => navigate("/register")}>Sign Up</Button></h4>
          </CardFooter>
      </Card>
    </div>
  )
}

export default Login
