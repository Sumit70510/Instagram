import useGetUserProfile from "@/Hooks/useGetUserProfile.jsx";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { Button } from "./ui/button.jsx";
import { Badge } from "./ui/badge.jsx";
import { AtSign, Heart, MessageCircle } from "lucide-react";
import { setAuthUser, setSelectedUser } from "@/Redux/authslice.js";
import api from '@/Lib/api.js';
import { toast } from "sonner";
import { setSelectedPost } from "@/Redux/postSlice.js";
import useTheme from "@/Redux/theme.js";
import CommentDialog from "./CommentDialog.jsx";

export default function Profile() {
  const params = useParams();
  const userId = params.id;
  
  useGetUserProfile(userId);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { posts, selectedPost } = useSelector((store) => store.post);
  const { userProfile , user , selectedUser  } = useSelector((store) => store.auth);
  const { themeMode } = useTheme();
  const [activeTab,setActiveTab] = useState('POSTS');
  const isLoggedInUserProfile = user?._id===userProfile?._id;
  const [isFollowing,setIsFollowing] = useState(false);
  const [open,setOpen] = useState(false);
  const [openSelectedPost,setOpenSelectedPost] = useState("")
  // console.log(user);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 690);
     window.addEventListener('resize', handleResize);
     setIsFollowing(user?.following?.includes(userProfile?._id));
     return () => window.removeEventListener('resize', handleResize);
    }, []);
    
     useEffect(() => {
          setIsFollowing(user?.following?.includes(userProfile?._id));
       }, [user,userProfile]);
    
  const handleTabChange = (tab) => 
      {
       setActiveTab(tab); 
      }
  
   const handleFollowUnFollow= async()=>
     {
       try
        {
          const res = await api.post(`/user/followorunfollow/${userProfile?._id}`);
          if (res.data.success) 
           {
             const newFollowing = isFollowing
             ? user?.following.filter(id => id !== userProfile?._id)
             :[...user?.following, userProfile?._id];
             setIsFollowing(!isFollowing);
            dispatch(setAuthUser({ ...user, following: newFollowing }));
            toast.success(res.data.message);
           }
          else
           {
            toast.error(res.data.message);
           }
        }
       catch(error)
        {
         console.log(error);
        }  
     } 
          
     
   const sendMessage = ()=>{
       dispatch(setSelectedUser(userProfile));
       navigate('/chat');
    } 
    
 const openPostDialog = async (postId) => {
  try {
    const res = await api.get(`/post/singelPost/${postId}`);

    if (res.data.success) {
      const fullPost = res.data.post;
      dispatch(setSelectedPost(fullPost));
      setOpenSelectedPost(fullPost);
      setOpen(true);
    }
  } catch (err) {
    console.log(err);
    toast.error("Failed to load post");
  }
};


  const displayedPost = activeTab==='POSTS'? userProfile?.posts : userProfile?.bookmarks;  
  
  return (
  <div className={`flex h-full justify-center scroll-smooth overflow-y-hidden ${isMobile?"":"mt-6 p-4 ml-[16%]"} ${themeMode === 'dark' ? 'bg-black text-slate-100' : 'bg-white text-slate-950'}`}>
    {/* <div className="flex flex-col gap-12 p-8"> */}
    <div className={`flex flex-col gap-6 p-2 h-full w-full max-w-full box-border scroll-smooth ${themeMode === 'dark' ? 'bg-black text-slate-100' : 'bg-white text-slate-950'}`}>

    {/* <div className="flex justify-between"> */}
    <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[1fr_2fr] sm:gap-4 w-full items-center sm:items-start">
     <section className="flex items-center justify-center">
      <Avatar className={`${isMobile?"h-28 w-28":"h-32 w-32"}`}>
        <AvatarImage src={userProfile?.profilePicture} alt="Profile Photo" />
        <AvatarFallback>
          {userProfile?.username?.slice(0, 2)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
     </section>
     <section className="flex items-center">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="font-bold">{userProfile?.username}</span>
          {isLoggedInUserProfile ? (
            <>
              <Link to='/account/edit'>
                <Button className={`flex h-8 ${themeMode === 'dark' ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800' : 'bg-gray-200 text-slate-950 hover:bg-gray-300'}`} variant="secondary">
                  Edit Profile
                </Button>
              </Link>
              <Button className={`h-8 ${themeMode === 'dark' ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800' : 'bg-gray-200 text-slate-950 hover:bg-gray-300'}`} variant="secondary">
                View Archive
              </Button>
              {/* <Button className="hover:bg-gray-200 h-8" variant="secondary">
                Ad Tools
              </Button> */}
            </>
          ) : 
           isFollowing ? (
            <>
            <Button className={`h-8 ${themeMode === 'dark' ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800' : 'bg-gray-300 text-slate-950 hover:bg-gray-400'}`} variant="secondary"
              onClick={handleFollowUnFollow} >
              Unfollow
            </Button>
            <Button className={`h-8 ${themeMode === 'dark' ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800' : 'bg-gray-300 text-slate-950 hover:bg-gray-400'}`} variant="secondary"
              onClick={sendMessage} >
              Message
            </Button>
            </>
          ) : (
            <Button className="h-8 bg-[#0095f6] text-white hover:bg-[#0d6fb1]" 
              onClick={handleFollowUnFollow} >
              Follow
            </Button>
           )
          }
        </div>
        
        <div className="flex items-center gap-2">
          <p className="font-semibold ml-3">
            {userProfile?.posts.length||0}
          </p>
          <span>Posts</span>
          <p className="font-semibold ml-3">
            {userProfile?.followers.length||0}
          </p>
          <span>Followers</span>
          <p className="font-semibold ml-3">
            {userProfile?.following.length||0}
          </p>
          <span>Following</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="">
            <Badge className='w-fit' variant='secondary'><AtSign/>{userProfile?.username}</Badge>
          </span>
          <span className="font-semibold whitespace-pre-line">
            {userProfile?.bio}
          </span>
          {/* <span className="">
            🧑‍💻 Code With Sumit007
          </span>
          <span className="">
            🧑‍💻 MERN Stack
          </span> */}
        </div>
      </div>
     </section>
    </div>
   
    <div className={`border-t ${themeMode === 'dark' ? 'border-zinc-800' : 'border-gray-500'} scroll-smooth`}>
    <div className={`flex items-center justify-center gap-10 text-sm ${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>
      <span className={`py-3 cursor-pointer ${activeTab==='POSTS'?'font-bold':''}`} onClick={()=>handleTabChange('POSTS')}>
        POSTS
      </span>
      <span className={`py-3 cursor-pointer ${activeTab==='SAVED'?'font-bold':''}`} onClick={()=>handleTabChange('SAVED')}>
        SAVED
      </span>
      <span className={`py-3 cursor-pointer ${activeTab==='REELS'?'font-bold':''}`} onClick={()=>handleTabChange('REELS')}>
        REELS
      </span>
      <span className={`py-3 cursor-pointer ${activeTab==='TAGS'?'font-bold':''}`} onClick={()=>handleTabChange('TAGS')}>
        TAGS
      </span>
    </div> 
    </div>
   
   <CommentDialog open={open} setOpen={setOpen} post={openSelectedPost}/>
  
   {/* <div className="grid grid-cols-3 gap-3"> */}
   <div className={`grid grid-cols-3 gap-1 ${isMobile?'overflow-y-scroll hide-scrollbar':'scroll-smooth'} w-full`}>
     {
      displayedPost?.slice()?.reverse()?.map((post)=>{
        return(
          <div key={post?._id} className="relative group cursor-pointer"
             onClick={() => {
               if (isMobile) {
                dispatch(setSelectedPost(post));
                navigate(`/${post?._id}/comments`);
                 } else {
                  openPostDialog(post?._id);
                }
              }}
            >
            <img src={post?.image} alt='Post Image' 
            // className='rounded-sm my-2 w-full aspect-square object-cover'
             className='rounded-sm my-2 w-full aspect-square object-cover' 
            />
             <div className="absolute my-2 inset-0 flex items-center justify-center bg-black
             opacity-0 transition-opacity duration-300 group-hover:opacity-60 rounded-lg">
              <div className="flex items-center text-white space-x-4">
                <button className="flex items-center text-white gap-2 hover:text-gray-300">
                  <Heart/>
                  <span>{post?.likes.length}</span>
                </button>
                <button className="flex items-center text-white gap-2 hover:text-gray-300">
                  <MessageCircle/>
                  <span>{post?.comments.length}</span>
                </button>
              </div>
            </div>  
          </div>  
        )
      })
     }
   </div>
  </div>
</div>
  );
}


