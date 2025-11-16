import { Heart, Home, Info, LogOut, MessageCircle, PlusIcon, Search, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import axios from 'axios';
import { toast } from 'sonner';
import CreatePost from './CreatePost.jsx';
import { setPosts, setSelectedPost } from '@/Redux/postSlice.js';
import { setAuthUser } from '@/Redux/authslice.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.jsx';
import { Button } from './ui/button.jsx';

export default function MobileUI() {  
    
   const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const auth = useSelector(state => state.auth) || {};
  const user = auth.user;
  
  const [open,setOpen] = useState(false);
  
  const headerItems = [
      //   {icon : <TrendingUp/>,
      //    text : "Explore" },
       {icon : <PlusIcon/>,
       text : "Create" },
      {icon : <Heart/>,
       text : "Notifications" },
       
  ];
  
  const footerItems = [
      {icon : <Home/>,
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
        const res = await axios.get('/api/v1/user/logout',
            { withCredentials : true }
           );
        if(res.data.success)
         {
           dispatch(setSelectedPost(null));
           dispatch(setPosts([]));
           dispatch(setAuthUser(null));
           navigate('/login');
           toast.success(res.data.message); 
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
         default:
           // Handle other cases if needed
          break;
       }
    } 
    
   const {likeNotification} = useSelector(store=>store.realTimeNotification); 
   
    
  return (
    <div className="flex flex-col h-screen">
  <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-700 bg-zinc-900 bg-opacity-70 fixed top-0 left-0 right-0 z-10">
  {/* <h1 className="text-lg font-bold text-white">LOGO</h1> */}
  <div className='flex gap-1 items-center'>
   <img src='/white.png' className='w-30 h-12'/>
     <a href='https://github.com/Sumit70510' rel='noreferrer' title='About The Developer' target='_blank'>
        <Info/>
      </a> 
  </div>
  <div className="flex items-center gap-3 relative">
    {headerItems.map((item, index) => (
      item.text === 'Notifications' ? (
        <div key={index} className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center justify-center hover:bg-zinc-700 cursor-pointer rounded-lg p-2 relative"
                aria-label={item.text}
              >
                <span className="text-xl">{item.icon}</span>
                {likeNotification.length > 0 && (
                  <span className="absolute bottom-4.5 left-4.5 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                    {likeNotification.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent className="bg-zinc-800 text-white border border-zinc-600 w-64">
              <div>
                {likeNotification.length === 0 ? (
                  <p>No New Notification</p>
                ) : (
                  likeNotification.map((notification) => (
                    <div key={notification?.userId} className="flex items-center gap-2 my-2">
                      <Avatar className="w-6 h-6 text-black">
                        <AvatarImage src={notification?.userDetails?.profilePicture} />
                        <AvatarFallback>
                          {notification?.userDetails?.username?.slice(0, 2).toUpperCase() || "CN"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm">
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
          className="flex items-center justify-center hover:bg-zinc-700 cursor-pointer rounded-lg p-2"
          onClick={() => navbarHandler(item.text)}
          aria-label={item.text}
        >
          <span className="text-xl">{item.icon}</span>
        </button>
      )
    ))}
  </div>
</header>


    <div className="flex-1 overflow-y-scroll hide-scrollbar pt-12 pb-12">
      <Outlet />
    </div>

    <footer className="h-12 flex items-center justify-around border-t border-zinc-700 bg-zinc-900 bg-opacity-70 fixed bottom-0 left-0 right-0 z-10">
       {footerItems.map((item, index) => (
        <button
          key={index}
          className="flex items-center gap-3 relative hover:bg-zinc-700 cursor-pointer rounded-lg p-3 my-3" 
          onClick={()=>navbarHandler(item.text)} aria-label={item.text}>
            <span className="text-xl">{item.icon}</span>   
        </button>))
       }
     </footer>
     <CreatePost open={open} setOpen={setOpen}/>
   </div>
  );
}
