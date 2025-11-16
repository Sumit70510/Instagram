import React, { useEffect, useState } from 'react'
import {Heart, Home, Info, LogOut, MessageCircle, PlusIcon, Search, TrendingUp} from 'lucide-react';
import { AvatarFallback ,Avatar,AvatarImage} from './ui/avatar.jsx';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/Redux/authslice.js';
import CreatePost from './CreatePost.jsx';
import { setPosts, setSelectedPost } from '@/Redux/postSlice.js';
import { Button } from './ui/button.jsx';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.jsx';

export default function LeftSidebar() {
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const auth = useSelector(state => state.auth) || {};
  const user = auth.user;
  
  const [open,setOpen] = useState(false);
  
  const sidebarItems = [
      {icon : <Home/>,
       text : "Home" },
      {icon : <Search/>,
       text : "Search" },
      {icon : <TrendingUp/>,
       text : "Explore" },
      {icon : <MessageCircle/>,
       text : "Messages" },
      {icon : <Heart/>,
       text : "Notifications" },
      {icon : <PlusIcon/>,
       text : "Create" },
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
         case 'Messages':
           navigate('/chat'); break;
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
     <div className='fixed top-0 z-10 left-0 px-2 border-r border-gray-300 w-auto h-screen'>
      <div className='flex flex-col px-4 h-full'>
     {/* <div className='fixed top-0 z-10 left-0 px-4 border-r border-gray-300 w-[16%] h-screen'> */}
        {/* <div className='flex flex-col'> */}
        {/* <h1 className='my-8 justify-center font-bold text-xl'>LOGO</h1>   */}
      
        {isSidebarExpanded?<img src='/Black.png' className='justify-center mt-8 mb-6 w-25 h-12'/>:
        <img src='/LOGO.png' className='justify-center mx-2 my-9 w-8 h-8'/>}
      
        <div>
          {
            sidebarItems.map((item,index)=>{
               return(
                <div key={index} className="flex items-center gap-3 relative hover:bg-gray-200 cursor-pointer
                    rounded-lg p-3 my-3" onClick={()=>sidebarHandler(item.text)}>
                 <div className="w-6 h-6">{item.icon}</div>
                  {isSidebarExpanded && <span>{item.text}</span>}
                  
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
