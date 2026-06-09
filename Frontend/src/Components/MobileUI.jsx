import { Heart, Home, Info, LogOut, Moon, MessageCircle, PlusIcon, Search, Sun, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import api from '@/Lib/api.js';
import { toast } from 'sonner';
import CreatePost from './CreatePost.jsx';
import { setPosts, setSelectedPost } from '@/Redux/postSlice.js';
import { setAuthUser } from '@/Redux/authslice.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.jsx';
import useTheme from '@/Redux/theme.js';
import { Button } from './ui/button.jsx';
import { useContext } from "react";
import { ScrollContext } from "../App.jsx";

export default function MobileUI() {  
    
   const navigate = useNavigate();
  const dispatch = useDispatch();
  const { themeMode, toggleTheme } = useTheme();
  
  const auth = useSelector(state => state.auth) || {};
  const user = auth.user;
  
//   const context = useContext(ScrollContext);
//   console.log("here");
// console.log(context);
  
  const [open,setOpen] = useState(false);
  const { scrollToTopStories } = useContext(ScrollContext);
  
  const headerItems = [
      //   {icon : <TrendingUp/>,
      //    text : "Explore" },
       {icon : <PlusIcon/>,
       text : "Create" },
      {icon : <Heart/>,
       text : "Notifications" },
       
  ];
  
  const footerItems = [
      {icon : <Home
              onClick={scrollToTopStories}/>
        ,
       text : "Home" },
      {icon : <Search/>,
       text : "Search" },
        {
         icon : <LogOut/> ,
         text : "Logout"
        }
      ,
       {icon : <MessageCircle/>,
         text : "Messages" }, 
      {icon : (
              <Avatar className='w-6 h-6 text-black'>
                <AvatarImage src={user?.profilePicture}/>
                <AvatarFallback>{user?.username?.slice(0,2).toUpperCase() || "CN"}</AvatarFallback>
              </Avatar> ),
       text : "Profile" },
    ];
  

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
   
  const navbarHandler = (textType)=>
    {
      switch(textType) 
       {
         case 'Logout':
           logoutHandler(); break;
         case 'Create':
           setOpen(true);   break;
         case 'Home':
           
           navigate('/'); 
             break;
         case 'Profile':
           navigate(`/profile/${user._id}`); break;
         case 'Messages':
           navigate('/chat'); break;
          case 'Search' :
            navigate('/Search'); break;  
         default:
           // Handle other cases if needed
          break;
       }
    } 
    
   const {likeNotification} = useSelector(store=>store.realTimeNotification); 
   
    
  return (
    <div className="flex flex-col h-screen bg-white text-slate-950 dark:bg-black dark:text-slate-100">
  <header className="h-12 flex items-center justify-between px-4 border-b border-slate-200 bg-white/90 text-slate-950 dark:border-zinc-800 dark:bg-black/95 dark:text-slate-100 fixed top-0 left-0 right-0 z-10 backdrop-blur-sm">
  <div className='flex gap-1 items-center'>
   <img src={themeMode === 'dark' ? '/white.png' : '/Black.png'} className='w-30 h-12'/>
     <a href='https://github.com/Sumit70510' rel='noreferrer' title='About The Developer' target='_blank' className='text-slate-950 dark:text-slate-100'>
        <Info />
     </a> 
  </div>
  <div className="flex items-end  relative">
    {headerItems.map((item, index) => (
      item.text === 'Notifications' ? (
        <div key={index} className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer rounded-lg p-2 relative text-slate-950 dark:text-slate-100"
                aria-label={item.text}>
                  
                <span className="text-xl">{item.icon}</span>
                  
                  {likeNotification.length > 0 && (
                    <span className="absolute bottom-4.5 left-4.5 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                     {likeNotification.length}
                    </span>
                   )}
                   
              </button>
            </PopoverTrigger>

            <PopoverContent className="bg-white text-slate-950 border border-slate-300 dark:bg-black/95 dark:text-slate-100 dark:border-zinc-800 w-64">
              <div>
                {likeNotification.length === 0 ? (
                  <p className="text-slate-700 dark:text-slate-300">No New Notification</p>
                ) : (
                  likeNotification.map((notification) => (
                    <div key={notification?.userId} className="flex items-center gap-2 my-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={notification?.userDetails?.profilePicture} />
                        <AvatarFallback>
                          {notification?.userDetails?.username?.slice(0, 2).toUpperCase() || "CN"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-bold">{notification?.userDetails?.username}</span>
                        &nbsp;liked your post
                      </p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <button
          key={index}
          className="flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer rounded-lg p-2 text-slate-950 dark:text-slate-100"
          onClick={() => navbarHandler(item.text)}
          aria-label={item.text}
        >
          <span className="text-xl">{item.icon}</span>
        </button>
      )
    )) }
    <button
      type="button"
      className="flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer rounded-lg p-2 text-slate-950 dark:text-slate-100"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <span className="text-xl">{themeMode === 'dark' ? <Sun /> : <Moon />}</span>
    </button>
  </div>
</header>


    <div className="flex-1 overflow-y-scroll hide-scrollbar pt-12 pb-12">
      <Outlet />
    </div>

    <footer className="h-12 flex items-center justify-around border-t border-slate-200 bg-white/90 text-slate-950 dark:border-zinc-800 dark:bg-black/95 dark:text-slate-100 fixed bottom-0 left-0 right-0 z-10 backdrop-blur-sm">
       {footerItems.map((item, index) => (
        <button
          key={index}
          className="flex items-center gap-3 relative hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer rounded-lg p-3 my-3 text-slate-950 dark:text-slate-100" 
          onClick={()=>navbarHandler(item.text)} aria-label={item.text}>
            <span className="text-xl">{item.icon}</span>   
        </button>))
       }
     </footer>
     <CreatePost open={open} setOpen={setOpen}/>
   </div>
  );
}
