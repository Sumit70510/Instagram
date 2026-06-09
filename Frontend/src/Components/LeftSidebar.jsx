import React, { useEffect, useState } from 'react'
import { Heart, Home, Info, LogOut, Moon, MessageCircle, PlusIcon, Search, Sun, TrendingUp } from 'lucide-react';
import { AvatarFallback, Avatar, AvatarImage } from './ui/avatar.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/Lib/api.js';
import { useDispatch, useSelector } from 'react-redux';
import useTheme from '@/Redux/theme.js';
import { setAuthUser } from '@/Redux/authslice.js';
import CreatePost from './CreatePost.jsx';
import { setPosts, setSelectedPost } from '@/Redux/postSlice.js';
import { Button } from './ui/button.jsx';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.jsx';
import { useContext } from "react";
import { ScrollContext } from "../App.jsx";

export default function LeftSidebar() {
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { themeMode, toggleTheme } = useTheme();
  
  const auth = useSelector(state => state.auth) || {};
  const user = auth.user;
  
  const [open,setOpen] = useState(false);
  const { scrollToTopStories } = useContext(ScrollContext);
  
  const sidebarItems = [
      {icon : <Home
               onClick={scrollToTopStories}/>,
       text : "Home" },
      {icon : <Search/>,
       text : "Search" },
      // {icon : <TrendingUp/>,
      //  text : "Explore" },
      {icon : <MessageCircle/>,
       text : "Messages" },
      {icon : <Heart/>,
       text : "Notifications" },
      {icon : <PlusIcon/>,
       text : "Create" },
      {
       icon: themeMode === 'dark' ? <Sun /> : <Moon />,
       text: 'Theme',
      },
      {icon : (
              <Avatar className='w-6 h-6'>
                <AvatarImage src={user?.profilePicture}/>
                <AvatarFallback>{user?.username?.slice(0,2).toUpperCase() || "CN"}</AvatarFallback>
              </Avatar> ),
       text : "Profile" },
      {
       icon : <LogOut/> ,
       text : "Logout"
      },
      {
       icon : <Info/> ,
       text : "About Us"
      }
    ]
  

  const logoutHandler = async()=>
   {
     try
      {
        const res = await api.post('/user/logout');
        if(res.data.success)
         {
           toast.success(res.data.message);
           dispatch(setSelectedPost(null));
           dispatch(setPosts([]));
           dispatch(setAuthUser(null));
           navigate('/login', { replace: true });
         }
      } 
     catch(error) {
        toast.error(error.response?.data?.message || "Logout failed");
       }
   }
   
  const sidebarHandler = (textType)=>
    {
      switch(textType) 
       {
         case 'Logout':
           logoutHandler(); break;
         case 'Create':
           setOpen(true);   break;
         case 'Home':
           navigate('/');   break;
         case 'Profile':
           navigate(`/profile/${user._id}`); break;
         case 'Theme':
           toggleTheme(); break;
         case 'Messages':
           navigate('/chat'); break;
         case 'Search' :
            navigate('/Search'); break;
          case 'About Us':
          window.open('https://github.com/Sumit70510', '_blank', 'noopener,noreferrer');
             break;    
         default:
           // Handle other cases if needed
          break;
       }
    } 
    
   const {likeNotification} = useSelector(store=>store.realTimeNotification); 
    
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarExpanded(window.innerWidth > 1106); // Adjust breakpoint as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); 
    
  return (
     <div className={`fixed top-0 z-10 left-0 px-2 w-auto h-screen border-r ${themeMode === 'dark' ? 'border-zinc-900 bg-zinc-950 text-slate-100 shadow-inner shadow-black/30' : 'border-gray-300 bg-white text-slate-950'}`}>
      <div className='flex flex-col px-4 h-full'>
     {/* <div className='fixed top-0 z-10 left-0 px-4 border-r border-gray-300 w-[16%] h-screen'> */}
        {/* <div className='flex flex-col'> */}
        {/* <h1 className='my-8 justify-center font-bold text-xl'>LOGO</h1>   */}
      
        {isSidebarExpanded ? (
          <img
            src={themeMode === 'dark' ? '/white.png' : '/Black.png'}
            className='justify-center mt-8 mb-6 w-25 h-12'
          />
        ) : (
          <img
            src={themeMode === 'dark' ? '/white.png' : '/Black.png'}
            className='justify-center mx-2 my-9 w-8 h-8'
          />
        )}
      
        <div>
          {
            sidebarItems.map((item,index)=>{
               return(
                <div key={index} className={`flex items-center gap-3 relative rounded-lg p-3 my-3 cursor-pointer transition ${themeMode === 'dark' ? 'bg-transparent hover:bg-zinc-800' : 'hover:bg-gray-200'}`} onClick={()=>sidebarHandler(item.text)}>
                 <div className={`${themeMode === 'dark' ? 'w-6 h-6 text-slate-100' : 'w-6 h-6 text-slate-950'}`}>{item.icon}</div>
                  {isSidebarExpanded && <span className={`${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>{item.text}</span>}
                  
                  {
                    item.text==='Notifications'&&likeNotification.length!==0&&
                    (
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button size='icon' className='rounded-full h-5 w-5
                          absolute bottom-6 left-6 bg-red-600 hover:bg-red-600'>
                          {likeNotification.length}
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent>
                        <div>
                          {likeNotification.length===0?
                            (<p>No New Notification</p> )
                             :
                            (
                              likeNotification.map((notification)=>{
                                return (
                                  <div key={notification?.userId} className='flex items-center gap-2 my-2'>
                                    <Avatar className='w-6 h-6'>
                                      <AvatarImage src={notification?.userDetails?.profilePicture}/>
                                      <AvatarFallback>{notification?.userDetails?.username.slice(0,2).toUpperCase() || "CN"}</AvatarFallback>
                                    </Avatar>
                                    <p className='text-sm'>
                                     <span className='font-bold'>
                                      {notification?.userDetails?.username}
                                     </span> 
                                      liked Your Post
                                    </p>
                                  </div>
                                )
                              })
                            )
                          }
                        </div>
                       </PopoverContent>
                     </Popover> 
                    )
                  }
              
                </div>   
            )})
          }
        </div> 
       </div>
       <CreatePost open={open} setOpen={setOpen}/>
     </div>
  )
}
