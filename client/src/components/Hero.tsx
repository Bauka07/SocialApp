import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden py-24 md:py-32">
      {/* Subtle animated background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className="relative max-w-5xl mx-auto px-4">
        <div className="text-center">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-8 border border-orange-100">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-orange-600">Welcome to SocApp</span>
          </div>

          {/* Main heading with enhanced gradient */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
              Connect & Share
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500">
              Your Amazing Story
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of users sharing amazing content and building meaningful 
            connections. Start your journey today and be part of something special.
          </p>

          {/* CTA Buttons with enhanced effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="group px-8 py-6 text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => navigate("/login")}
            >
              Get Started 
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-gray-700 font-semibold rounded-xl transition-all duration-300"
              onClick={() => navigate("/contact")}
            >
              Learn More
            </Button>
          </div>

          {/* Enhanced stats with cards */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 mb-2">10+</div>
              <div className="text-sm text-gray-600 font-medium">Active Users</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 mb-2">50+</div>
              <div className="text-sm text-gray-600 font-medium">Posts Shared</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 mb-2">4.9★</div>
              <div className="text-sm text-gray-600 font-medium">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero