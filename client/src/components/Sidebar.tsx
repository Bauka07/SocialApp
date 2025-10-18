import React, { useState } from "react";
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiHome,
  FiMessageSquare,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // mobile sidebar
  const [collapsed, setCollapsed] = useState(false); // collapse toggle
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const links = [
    { name: "Posts", path: "/dashboard", icon: <FiFileText /> },
    { name: "Profile", path: "/profile", icon: <FiUser /> },
    { name: "Chats", path: "/chats", icon: <FiMessageSquare /> },
    { name: "Settings", path: "/settings", icon: <FiSettings /> },
  ];

  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-orange-500 text-white p-2 rounded-md shadow-md hover:bg-orange-600 transition md:hidden"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full bg-gray-900 text-white z-40 flex flex-col justify-between shadow-xl transform transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1
              onClick={() => navigate("/dashboard")}
              className={clsx(
                "text-2xl font-bold text-orange-400 cursor-pointer transition",
                collapsed && "hidden"
              )}
            >
              MiniSocial
            </h1>
            {/* Collapse Toggle Button */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex text-gray-400 hover:text-orange-400 transition"
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col mt-8 space-y-3 px-4">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-3 text-lg p-2 rounded-md transition duration-200 relative group",
                  location.pathname === link.path
                    ? "bg-orange-500 text-white"
                    : "hover:bg-gray-800 hover:text-orange-400"
                )}
              >
                <span>{link.icon}</span>

                {/* Label (hidden when collapsed) */}
                {!collapsed && <span>{link.name}</span>}

                {/* Tooltip on hover (only when collapsed) */}
                {collapsed && (
                  <span className="absolute left-16 bg-gray-800 text-sm text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {link.name}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-lg text-red-400 hover:text-red-500 transition relative group"
          >
            <FiLogOut size={20} />
            {!collapsed && <span>Logout</span>}

            {collapsed && (
              <span className="absolute left-16 bg-gray-800 text-sm text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
