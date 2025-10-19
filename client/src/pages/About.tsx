import { assets } from '@/assets/assets';
import React from 'react'
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="mt-4 shadow-[0_5px_15px_rgba(0,0,0,0.35)] flex flex-col md:flex-row items-center justify-center gap-10 py-15 px-6 rounded-2xl bg-gray-50">
      {/* Left side */}
      <div className="w-full md:w-1/2 flex justify-center">
        <img
          src={assets.About}
          alt="About us"
          className="rounded-2xl shadow-lg w-full max-w-md object-cover"
        />
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 text-center md:text-left">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          About <span className="text-orange-400">Us</span>
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Mini Social is a simple and friendly platform to share your thoughts,
          connect with friends, and explore inspiring posts. Our mission is to
          make social interactions smoother, more positive, and meaningful.
        </p>

        <button className="bg-orange-400 text-white px-6 py-3 rounded-lg shadow-md hover:bg-orange-500 transition mb-6">
          Learn More
        </button>

        {/* Social icons */}
        <div className="flex justify-center md:justify-start gap-5  text-2xl">
          <Link to={"https://github.com"} target="_blank" rel="noopener noreferrer">
            <FaGithub className="text-gray-800 hover:text-black transition" />
          </Link>
          <Link to={"https://linkedin.com"} target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="text-blue-500 hover:text-blue-700 transition" />
          </Link>
          <Link to={"https://google.com"} target="_blank" rel="noopener noreferrer">
            <FaTelegram className="text-blue-600 hover:text-blue-800 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default About
