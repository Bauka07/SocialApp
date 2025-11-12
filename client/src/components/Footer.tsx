import React from "react";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-20 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      
      <div className="relative px-6 sm:px-12 lg:px-20 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand with logo */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">S</span>
                </div>
                <span className="text-2xl font-bold text-white">SocApp</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                A modern platform to share your thoughts, connect with inspiring people, 
                and stay engaged with meaningful content. Join our growing community today.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                <Link to="https://github.com/Bauka07" target="_blank" rel="noopener noreferrer">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 transition-all duration-300 hover:scale-110 group shadow-md">
                    <FaGithub className="text-gray-400 group-hover:text-white" />
                  </div>
                </Link>
                <Link to="https://www.linkedin.com/in/bauyrzhan-nurzhanov-9802ba380/" target="_blank" rel="noopener noreferrer">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 transition-all duration-300 hover:scale-110 group shadow-md">
                    <FaLinkedin className="text-gray-400 group-hover:text-white" />
                  </div>
                </Link>
                <Link to="https://t.me/+ndguPU6gVw82MzU6" target="_blank" rel="noopener noreferrer">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 transition-all duration-300 hover:scale-110 group shadow-md">
                    <FaTelegram className="text-gray-400 group-hover:text-white" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-3">
                <Link to="/" className="block text-gray-400 hover:text-orange-400 transition-colors duration-200">
                  Home
                </Link>
                <Link to="/about" className="block text-gray-400 hover:text-orange-400 transition-colors duration-200">
                  About Us
                </Link>
                <Link to="/contact" className="block text-gray-400 hover:text-orange-400 transition-colors duration-200">
                  Contact
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors duration-200">
                  Privacy Policy
                </a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors duration-200">
                  Terms of Service
                </a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors duration-200">
                  Help Center
                </a>
              </div>
            </div>
          </div>

          {/* Bottom line */}
          <div className="pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} SocApp. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Made with <span className="text-orange-500">♥</span> for amazing people
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;