import { useState } from 'react'
import { assets, menuLinks } from "../assets/assets.ts"
import { Link, NavLink } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [visibleInput, setVisibleInput] = useState(false)

  return (
    <div className='flex justify-between items-center py-2'>
      <Link to={"/"} className='text-gray-700 text-4xl cursor-pointer font-bold'>SocApp.</Link>

      <ul className='hidden sm:flex gap-10 text-sm text-gray-700'>
        {
          menuLinks.map((link, index) => (
            <NavLink to={link.path} key={index} className="text-[18px] flex flex-col items-center gap-1">
              {({isActive}) => (
                <>
                  {link.name}
                  {isActive && <hr className='border-none w-2/4 h-[1.5px] bg-gray-700' />}
                </>
              )}  
            </NavLink>
          ))
        }
      </ul>
      
      <div className='flex items-center gap-9 relative'>
        {visibleInput && (<Input type="email" placeholder="Email" className='hidden xl:flex  absolute right-35 w-48 transition-all duration-300'/>)}
        <img src={assets.search_icon} alt="search_icon" className='w-5 hidden xl:flex cursor-pointer' onClick={() => setVisibleInput(!visibleInput)} />



        <Link to="/login">
          <Button size="default" className='text-md' variant="default">Login</Button>
        </Link>

        <img src={assets.menu_icon} alt="menu_icon" className='w-5 cursor-pointer sm:hidden' onClick={() => setVisible(true)}/>
      </div>

      <div className={`bg-white overflow-hidden absolute top-0 right-0 bottom-0 transition-all duration-150 ease-linear ${visible ? "w-full" : "w-0"}`}>
        <div className='flex flex-col text-gray-600'>
          <div className='flex items-center gap-4 cursor-pointer p-3' onClick={() => setVisible(false)}>
            <img src={assets.cross_icon} alt="cross_icon" className='h-4 rotate-180' />
            <p>Back</p>
          </div>
          <ul className='flex flex-col items-center gap-6 mt-15 lg:mt-20'>
            {
              menuLinks.map((link) => (
                <NavLink key={link.name} onClick={() => setVisible(false)} to={link.path} className="text-[18px] py-2 pl-6 ">
                  {link.name}
                </NavLink>
              ))
            }
        </ul>
        </div>
      </div>

    </div>
  )
}

export default Navbar
