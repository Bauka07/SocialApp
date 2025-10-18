import React from "react";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-30 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-center text-center md:text-left">
        {/* Left - Brand */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Mini <span className="text-orange-400">Social</span>
          </h3>
          <p className="text-sm text-gray-400">
            Share your thoughts. Connect with people. Stay inspired.
          </p>
        </div>

        {/* Middle - Quick Links */}
        <div className="flex flex-col gap-2">
          <h4 className="text-lg font-semibold text-white mb-2">Quick Links</h4>
          <Link to="/" className="hover:text-orange-400 transition">Home</Link>
          <Link to="/about" className="hover:text-orange-400 transition">About Us</Link>
          <Link to="/contact" className="hover:text-orange-400 transition">Contact</Link>
        </div>

        {/* Right - Social icons */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Follow Us</h4>
          <div className="flex justify-center md:justify-start gap-5 text-2xl text-blue-500">
            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
              <FaGithub className="hover:text-blue-400 transition" />
            </a>
            <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className="hover:text-blue-400 transition" />
            </a>
            <a href="https://t.me/yourusername" target="_blank" rel="noopener noreferrer">
              <FaTelegram className="hover:text-blue-400 transition" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Mini Social. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
