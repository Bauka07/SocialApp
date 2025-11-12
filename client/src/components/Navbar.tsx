import { useState, useEffect } from 'react'
import { assets, menuLinks } from "../assets/assets.ts"
import { Link, NavLink } from 'react-router-dom'
import { Button } from "@/components/ui/button"

const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Enhanced navbar with blur */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-lg shadow-lg shadow-orange-500/5' 
          : 'bg-white/80 backdrop-blur-md'
      }`}>
        <div className="px-6 sm:px-12 lg:px-20">
          <div className="flex justify-between items-center h-20">
            {/* Professional Logo Design */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                
                {/* Logo container */}
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <span className="text-white text-2xl font-bold tracking-tight">S</span>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block group-hover:text-orange-500 transition-colors duration-300">
                SocApp
              </span>
            </Link>

            {/* Desktop Menu */}
            <ul className="hidden md:flex items-center gap-8">
              {menuLinks.map((link) => (
                <NavLink
                  to={link.path}
                  key={link.path}
                  className="relative text-[15px] font-medium text-gray-600 hover:text-orange-500 transition-colors duration-300"
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block">
                <Button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  Login
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setVisible(true)}
                className="md:hidden p-2.5 hover:bg-orange-50 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Mobile Menu */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        visible ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop with blur */}
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setVisible(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Header with logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <span className="text-lg font-bold text-gray-900">SocApp</span>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-2 hover:bg-orange-50 rounded-xl transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <ul className="p-6 space-y-2">
            {menuLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setVisible(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-orange-50 rounded-xl font-medium transition-all duration-200"
              >
                {({ isActive }) => (
                  <span className={isActive ? 'text-orange-500 font-semibold' : ''}>
                    {link.name}
                  </span>
                )}
              </NavLink>
            ))}
          </ul>

          {/* Mobile Login */}
          <div className="p-6 border-t border-gray-100">
            <Link to="/login" onClick={() => setVisible(false)}>
              <Button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-md">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20" />
    </>
  )
}

export default Navbar