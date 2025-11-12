import React, { useState } from "react";
import {
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiUser,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed: externalCollapsed, setCollapsed: externalSetCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalSetCollapsed || setInternalCollapsed;
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event('auth-change'));
      navigate("/");
    }
  };

  const links = [
    { name: "Feed", path: "/dashboard", icon: <FiHome /> },
    { name: "Profile", path: "/profile", icon: <FiUser /> },
    { name: "Messages", path: "/chats", icon: <FiMessageSquare /> },
    { name: "Settings", path: "/settings", icon: <FiSettings /> },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 md:hidden"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Sidebar - FIXED ANIMATION */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white z-40 flex flex-col justify-between shadow-2xl",
          // Mobile: slide animation
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, smooth width transition
          "md:translate-x-0 md:transition-all md:duration-300 md:ease-in-out",
          collapsed ? "md:w-20" : "md:w-64",
          // Mobile width
          "w-64"
        )}
      >
        <div>
          {/* Header with Logo */}
          <div className={clsx(
            "flex items-center p-5 border-b border-gray-700/50 transition-all duration-300",
            collapsed ? "md:justify-center" : "justify-between"
          )}>
            <div 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 cursor-pointer transition-all duration-300"
            >
              {/* Logo */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              
              {/* App Name - smooth fade transition */}
              <span className={clsx(
                "text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent transition-all duration-300",
                collapsed ? "md:opacity-0 md:w-0 md:invisible" : "md:opacity-100 md:w-auto md:visible"
              )}>
                SocApp
              </span>
            </div>

            {/* Collapse Button - Desktop Only */}
            {!collapsed && (
              <button
                onClick={toggleCollapse}
                className="hidden md:flex text-gray-400 hover:text-orange-400 transition-colors duration-200 p-1 hover:bg-gray-800 rounded-lg"
              >
                <FiChevronLeft className="text-xl" />
              </button>
            )}
          </div>

          {/* Expand Button - Shows when collapsed on desktop */}
          {collapsed && (
            <div className="hidden md:flex justify-center pt-4 pb-2">
              <button
                onClick={toggleCollapse}
                className="text-gray-400 hover:text-orange-400 transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg"
              >
                <FiChevronRight className="text-xl" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col mt-6 space-y-1 px-3">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={clsx(
                    "flex items-center text-base py-3 rounded-xl transition-all duration-200 relative group",
                    collapsed ? "md:justify-center md:px-3" : "gap-3 px-4",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800 hover:text-orange-400"
                  )}
                >
                  <span className="flex-shrink-0 text-xl">{link.icon}</span>

                  {/* Label - smooth transition */}
                  <span className={clsx(
                    "font-medium transition-all duration-300",
                    collapsed ? "md:opacity-0 md:w-0 md:invisible" : "md:opacity-100 md:w-auto md:visible"
                  )}>
                    {link.name}
                  </span>

                  {/* Active indicator */}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full" />
                  )}

                  {/* Tooltip for collapsed mode - desktop only */}
                  {collapsed && (
                    <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 text-sm text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
                      {link.name}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center text-base py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 relative group w-full",
              collapsed ? "md:justify-center md:px-3" : "gap-3 px-4"
            )}
          >
            <FiLogOut size={20} className="flex-shrink-0" />
            
            <span className={clsx(
              "font-medium transition-all duration-300",
              collapsed ? "md:opacity-0 md:w-0 md:invisible" : "md:opacity-100 md:w-auto md:visible"
            )}>
              Logout
            </span>

            {collapsed && (
              <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 text-sm text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
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
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;