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
        "http://26.176.162.130:8080/users/register",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      const { token } = response.data
      localStorage.setItem("token", token)
      window.dispatchEvent(new Event('auth-change'))
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
    <div className='flex items-center justify-center min-h-screen w-full py-12 px-4'>
      <div className="fixed top-0 left-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      
      <Card className="relative w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border-2 border-orange-100 rounded-3xl overflow-hidden z-10">
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">S</span>
            </div>
          </div>
          <CardTitle className='text-3xl font-bold text-gray-900'>Create Account</CardTitle>
          <p className="text-gray-600 text-sm mt-2">Join SocApp and start connecting</p>
        </CardHeader>

        <CardContent className="px-8">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  required
                  onChange={handleChange}
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                />
              </div>

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
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars with uppercase, lowercase, numbers"
                  required
                  onChange={handleChange}
                  value={formData.password}
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                />
                {formData.password && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-gray-50">
                    {formData.password.length >= 8 && 
                    /[A-Z]/.test(formData.password) && 
                    /[a-z]/.test(formData.password) && 
                    /[0-9]/.test(formData.password) ? (
                      <>
                        <span className="text-green-600 text-lg">✓</span>
                        <span className="text-green-600 text-xs font-medium">Strong password</span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-600 text-lg">⚠</span>
                        <span className="text-amber-600 text-xs font-medium">
                          Needs: 8+ chars, uppercase, lowercase, number
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

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
                    Creating...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="pb-8 px-8">
          <p className="text-center text-sm text-gray-600 w-full">
            Already have an account?{' '}
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
  )
}

export default Register