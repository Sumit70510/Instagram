import React, { createContext, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar.jsx';
import MobileUI from './MobileUI.jsx';
import useTheme from '@/Redux/theme.js';


export default function MainLayout() {

  const { themeMode } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);

  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 690);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
   }, []);


  return (
      
    <div className="min-h-screen flex hide-scrollbar">
      {/* Left Sidebar min-w-[200px] max-w-[250px]*/}
     {/* Sidebar / Mobile UI */}
      
      {isMobile ? (
         <div className="overflow-hidden h-screen w-screen">
          <MobileUI/>
        </div>
          
      ) : ( 
        <>
        <div className={`overflow-y-auto hide-scrollbar fixed top-0 left-0 w-auto h-screen border-r ${themeMode === 'dark' ? 'border-zinc-900 bg-zinc-950' : 'border-gray-300 bg-white'}`}>
          {/* min-w-[200px] max-w-[250px] */}
          <LeftSidebar />
        </div>
      
         <div className="flex-1 flex justify-center hide-scrollbar">
          <div className="w-full overflow-y-scroll hide-scrollbar">   
           <Outlet />
          </div>
         </div>
        </>
      )}
    </div>
  );
}
