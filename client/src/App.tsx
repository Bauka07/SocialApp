import Home from './pages/Home'
import { useState, useEffect } from 'react'
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
import Chat from './pages/Chat'
import Settings from "./pages/Settings"
import OAuthCallback from './pages/OAuthCallback'
import ForgotPassword from './pages/ForgotPassword'

const App = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });
  
  // Check authentication status on mount and location change
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };
    
    checkAuth();
    
    // Listen for storage changes (logout from sidebar)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, [location.pathname]);
  
  // Routes where we should NOT show navbar/footer (login/register only)
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);
  
  // Routes that show sidebar (protected routes)
  const protectedRoutes = ['/dashboard', '/profile', '/chats', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
  // Show sidebar ONLY on protected routes when authenticated
  const showSidebar = isAuthenticated && isProtectedRoute;
  
  // Show navbar on ALL pages EXCEPT login/register AND protected routes
  const showNavbar = !isAuthPage && !isProtectedRoute;
  
  // Show footer on ALL pages EXCEPT login/register and protected routes
  const showFooter = !isAuthPage && !isProtectedRoute;
    
  return (
    <div>
      <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        {/* Show Navbar on all pages except login/register */}
        {showNavbar && <Navbar />}

        {/* Show Sidebar only on protected routes when authenticated */}
        {showSidebar && (
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        )}
      </div>

      {/* Content area with conditional margin */}
      <div className={`
        transition-all duration-300
        ${showSidebar ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''}
        ${!isProtectedRoute ? 'px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]' : ''}
      `}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/auth/callback' element={<OAuthCallback />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />

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
                <Profile />
              </ProtectedRoute>
            }
          /> 
          <Route 
            path='/chats'
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route 
            path='/settings'
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* Show Footer on public pages and home when not on protected routes */}
      {showFooter && <Footer />}
    </div>
  )
}

export default App