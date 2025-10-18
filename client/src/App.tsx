import Home from './pages/Home'
import React from 'react'
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
const App = () => {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];

   const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  return (
    <div>
      <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <Sidebar/>
        {!shouldHideNavbar && <Navbar/>}
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/about' element={<About/>} />
          <Route path='/contact' element={<Contact/>} />
          <Route path='/register' element={<Register/>} />
          <Route path='/login' element={<Login/>} />

          <Route path='/dashboard' element={
            <ProtectedRoute>
              <Dashboard/>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
      {!shouldHideNavbar && <Footer/>}
    </div>
  )
}

export default App
