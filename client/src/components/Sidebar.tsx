import React, { useState } from "react";
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiMessageSquare,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed: externalCollapsed, setCollapsed: externalSetCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false); // for mobile sidebar
  const [internalCollapsed, setInternalCollapsed] = useState(false); // for collapse toggle
  
  // Use external state if provided, otherwise use internal
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalSetCollapsed || setInternalCollapsed;
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

  const handleNavClick = (path: string) => {
    navigate(path);
    // Only close mobile sidebar, don't reset collapse state
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-orange-500 text-white p-2 rounded-md shadow-md hover:bg-orange-600 transition md:hidden"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full bg-gray-900 text-white z-50 flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: collapse width
          collapsed ? "md:w-20" : "md:w-64",
          // Mobile: always full width when open
          "w-64"
        )}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1
              onClick={() => navigate("/dashboard")}
              className={clsx(
                "text-2xl font-bold text-orange-400 cursor-pointer overflow-hidden whitespace-nowrap transition-all duration-300",
                collapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
              )}
            >
              MiniSocial
            </h1>

            {/* Collapse Button (Desktop only) */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex text-gray-400 hover:text-orange-400 transition"
            >
              {collapsed ? (
                <FiChevronRight className="text-2xl" />
              ) : (
                <FiChevronLeft className="text-2xl" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col mt-8 space-y-3 px-4">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={clsx(
                  "flex items-center gap-3 text-lg p-2 rounded-md transition duration-200 relative group",
                  location.pathname === link.path
                    ? "bg-orange-500 text-white border-l-4 border-orange-400"
                    : "hover:bg-gray-800 hover:text-orange-400"
                )}
              >
                <span className="flex-shrink-0">{link.icon}</span>

                {/* Label (hidden when collapsed on desktop) */}
                <span
                  className={clsx(
                    "transition-all duration-300",
                    collapsed
                      ? "md:w-0 md:opacity-0 md:hidden"
                      : "w-auto opacity-100"
                  )}
                >
                  {link.name}
                </span>

                {/* Tooltip (for collapsed mode on desktop) */}
                {collapsed && (
                  <span className="hidden md:block absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-sm text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {link.name}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-lg text-red-400 hover:text-red-500 transition relative group w-full"
          >
            <FiLogOut size={20} className="flex-shrink-0" />
            <span
              className={clsx(
                "transition-all duration-300",
                collapsed ? "md:w-0 md:opacity-0 md:hidden" : "w-auto opacity-100"
              )}
            >
              Logout
            </span>

            {collapsed && (
              <span className="hidden md:block absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-sm text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;