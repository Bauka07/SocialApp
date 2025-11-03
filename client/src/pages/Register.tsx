import React, { useEffect, useState } from 'react'
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
  error: string;
  token: string;
  user: {
    id: number
  }
}

interface ApiError {
  error: string
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
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      navigate("/dashboard")
    }
  }, [navigate])
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setError(null)
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  // Frontend validation for better UX
  if (formData.password.length < 8) {
    setError("Password must be at least 8 characters")
    setLoading(false)
    return
  }

  if (formData.password.length > 72) {
    setError("Password must not exceed 72 characters")
    setLoading(false)
    return
  }

  const hasUpper = /[A-Z]/.test(formData.password)
  const hasLower = /[a-z]/.test(formData.password)
  const hasDigit = /[0-9]/.test(formData.password)

  if (!hasUpper || !hasLower || !hasDigit) {
    setError("Password must contain uppercase, lowercase, and numbers")
    setLoading(false)
    return
  }

  try {
    const response = await axios.post<RegisterResponse>(
      "http://localhost:8080/users/register",
      formData,
      {
        headers: { "Content-Type": "application/json" },
      }
    )
    const { token } = response.data
    localStorage.setItem("token", token)
    toast.success("Account created successfully!")
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
                  placeholder="Min 8 chars with uppercase, lowercase, numbers"
                  required
                  onChange={handleChange}
                  value={formData.password}
                />
                {/* Real-time password strength indicator */}
                {formData.password && (
                  <p className="text-xs mt-1">
                    {formData.password.length >= 8 && 
                    /[A-Z]/.test(formData.password) && 
                    /[a-z]/.test(formData.password) && 
                    /[0-9]/.test(formData.password)
                      ? <span className="text-green-600">✓ Strong password</span>
                      : <span className="text-amber-600">⚠ Needs: 8+ chars, uppercase, lowercase, number</span>
                    }
                  </p>
                )}
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