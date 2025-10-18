import { assets } from '@/assets/assets'
import React from 'react'
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 md:py-35  px-4  rounded-2xl mt-6 shadow-[0_5px_15px_rgba(0,0,0,0.35)] bg-gray-50">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
        Welcome to <span className="text-orange-400">Social App</span>
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-8">
        If you want to see amazing posts and connect with people, 
        please log in first. Start sharing your thoughts today!
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
        variant="default" size="lg" 
        className='className="px-6 py-6 border border-black hover:bg-transparent hover:text-black transition ease-linear duration-200'
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
        <Button
        variant="outline" size="lg"
        className='className="border px-6 py-6 hover:border-black transition ease-linear duration-200' 
          onClick={() => navigate("/contact")}

        >
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default Hero
