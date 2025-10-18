import React, { useState } from "react";
import { FiUser, FiSettings, FiLogOut, FiMenu, FiX } from "react-icons/fi";

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-orange-400 text-white p-2 rounded-md shadow-md hover:bg-orange-500 transition"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-40 shadow-lg`}
      >
        <div className="p-6">
          <h2 className="text-2xl mt-20 font-bold text-orange-400 mb-8">Mini Social</h2>

          <nav className="flex flex-col gap-4">
            <button className="flex items-center gap-3 text-lg hover:text-orange-400 transition">
              <FiUser /> Profile
            </button>
            <button className="flex items-center gap-3 text-lg hover:text-orange-400 transition">
              <FiSettings /> Settings
            </button>
            <button className="flex items-center gap-3 text-lg text-red-400 hover:text-red-500 transition">
              <FiLogOut /> Logout
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
