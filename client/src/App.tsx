import Home from './pages/Home'
import React, { useState } from 'react'
import { Route, Routes, useLocation } from "react-router-dom"
import About from './pages/About'
import Contact from './pages/Contact'
import Sidebar from './components/Sidebar'
import Register from './pages/Register'
import Login from './pages/Login'
import Navbar from './components/Navbar'
import { ToastContainer } from "react-toastify"
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'

const App = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const hideNavbarRoutes = ['/login', '/register'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  const token = localStorage.getItem("token");
  const showSidebar = token && !["/login", "/register"].includes(location.pathname);
  
  // Check if current route is a protected route
  const protectedRoutes = ['/dashboard', '/profile'];
  const isProtectedRoute = protectedRoutes.includes(location.pathname);
    
  return (
    <div>
      <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        {!token && !shouldHideNavbar && <Navbar />}

        {showSidebar && (
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        )}
      </div>

      {/* Content area with conditional margin for protected routes */}
      <div className={`
        transition-all duration-300
        ${isProtectedRoute && showSidebar ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''}
        ${!isProtectedRoute ? 'px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]' : ''}
      `}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />

          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route 
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile/>
              </ProtectedRoute>
            }
          /> 
        </Routes>
      </div>

      {!token && !shouldHideNavbar && <Footer />}
    </div>
  )
}

export default App