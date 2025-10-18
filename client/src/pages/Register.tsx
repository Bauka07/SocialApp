import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from 'react-router-dom'
import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'

type RegisterRequest = {
  username: string;
  email: string;
  password: string;
}

type RegisterResponse = {
  message: string;
  token: string;
  user: {
    id: number
  }
}

interface ApiError {
  message: string
}

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await axios.post<RegisterResponse>(
        "http://localhost:8080/users/register",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      setTimeout(() => navigate("/dashboard"), 500)
      setTimeout(() => toast.success("Registered successfully"), 500)
      const { token, message, user } = response.data
      localStorage.setItem("token", token)
    } catch (err) {
      const error = err as AxiosError<ApiError>
      setError(error.response?.data?.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center justify-center h-screen w-full'>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className='text-3xl text-center'>Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={handleChange}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <CardFooter className="flex-col gap-2 mt-2">
                <Button type="submit" className="w-[70%]" disabled={loading}>
                  {loading ? "Creating..." : "Sign Up"}
                </Button>
                <Button variant="outline" className="w-[70%]">
                  Sign Up with Google
                </Button>
                <h4>
                  Already have an account?
                  <Button variant="link" onClick={() => navigate("/login")}>
                    Sign In
                  </Button>
                </h4>
              </CardFooter>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register
