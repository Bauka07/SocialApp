import React from 'react'
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

const Register: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className='flex items-center justify-center h-screen w-full'>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className='text-3xl text-center'>Create your account </CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="text">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-[70%]">
            Sign Up
          </Button>
          <Button variant="outline" className="w-[70%]">
            Sign Up with Google
          </Button>
            <h4>Already have an account?<Button variant="link" onClick={() => navigate("/login")}>Sign In</Button></h4>
            
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register
