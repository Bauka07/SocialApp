import { assets } from '@/assets/assets';
import React from 'react'
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="relative mt-8 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      
      <div className="relative flex flex-col md:flex-row items-center justify-center gap-12 py-20 px-6 md:px-12 rounded-3xl backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl">
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500" />
            <img
              src={assets.About}
              alt="About us"
              className="relative rounded-2xl shadow-2xl w-full max-w-md object-cover transform group-hover:scale-105 transition duration-500"
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <div>
            <span className="inline-block px-4 py-1 bg-orange-100 text-orange-600 text-sm font-semibold rounded-full mb-4">
              About Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Building
              <span className="block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Connections
              </span>
            </h2>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed">
            Mini Social is a modern platform designed to bring people together. 
            Share your thoughts, connect with friends, and explore inspiring content 
            in a clean, intuitive environment. Our mission is to make social 
            interactions meaningful, positive, and enjoyable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Learn More →
            </button>
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300">
              Our Mission
            </button>
          </div>

          {/* Social icons */}
          <div className="pt-6">
            <p className="text-sm text-gray-500 mb-4">Follow us on social media</p>
            <div className="flex justify-center md:justify-start gap-4">
              <Link to="https://github.com/Bauka07" target="_blank" rel="noopener noreferrer">
                <div className="p-3 rounded-xl bg-gray-100 hover:bg-orange-500 text-gray-700 hover:text-white transition-all duration-300 hover:scale-110">
                  <FaGithub className="text-xl" />
                </div>
              </Link>
              <Link to="https://www.linkedin.com/in/bauyrzhan-nurzhanov-9802ba380/" target="_blank" rel="noopener noreferrer">
                <div className="p-3 rounded-xl bg-gray-100 hover:bg-orange-500 text-gray-700 hover:text-white transition-all duration-300 hover:scale-110">
                  <FaLinkedin className="text-xl" />
                </div>
              </Link>
              <Link to="https://t.me/+ndguPU6gVw82MzU6" target="_blank" rel="noopener noreferrer">
                <div className="p-3 rounded-xl bg-gray-100 hover:bg-orange-500 text-gray-700 hover:text-white transition-all duration-300 hover:scale-110">
                  <FaTelegram className="text-xl" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About