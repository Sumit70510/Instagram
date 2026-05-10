import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog.jsx';
import { Bookmark, BookMarked, BookMarkedIcon, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { FaBookmark, FaHeart , FaRegHeart } from 'react-icons/fa';
import CommentDialog from './CommentDialog.jsx';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/Lib/api.js';
import { setPosts, setSelectedPost } from '@/Redux/postSlice.js';
import { Badge } from './ui/badge.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthUser } from '@/Redux/authslice.js';

export default function Post({post}) 
 {
   const [text,setText] = useState("");
   const [open,setOpen] = useState(false);
   const {user} = useSelector(store=>store.auth);
   const {posts} = useSelector(store=>store.post);
   const dispatch = useDispatch();
   const [postLike , setPostLike] = useState(post?.likes?.length);
   const [liked,setLiked] = useState(post?.likes?.includes(user?._id)||false);
   const [isBookmarked,setIsBookmarked] = useState(false);
   const [isFollowing,setIsFollowing] = useState(false);
   const [comment,setComment] = useState(post?.comments);
   const navigate = useNavigate();
   const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
   
   useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 690);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
     }, []);
     useEffect(() => {
      setIsBookmarked(user?.bookmarks?.includes(post?._id));
      setIsFollowing(user?.following?.includes(post?.author?._id));
   }, [user]);
   const changeEventHandler = (e)=>
     {
        const inputText = e.target.value;
        if(inputText.trim())
         {
           setText(inputText); 
         }
        else
         {
           setText("");
         }       
     }
     
   const commentHandler = async()=>
     {
        try
         {
           const res = await api.post(`/post/${post?._id}/comment`,{text},
             {
              headers:{
                 "Content-Type": "application/json" 
               }
             }
            );
           if(res.data.success)
            {
              const updatedCommentData = [...comment,res.data.comment];
              setComment(updatedCommentData);
              const updatedPostData =  posts.map(p=> 
                p?._id===post?._id?{...p,comments:updatedCommentData}:p
               );
              dispatch(setPosts(updatedPostData)); 
              setText('');
              toast.success(res.data.message);
            } 
         }
        catch(error)
         {
           console.log(error);
         } 
     }  
   
   const likeOrDislikeHandler = async()=>
     {
       try
        {
          const action = liked?'dislike':'like';
          const res = await api.get(`/post/${post._id}/${action}`);
          if(res.data.success)
           {
             const updateLikes = liked ? postLike-1 : postLike+1 ;
             setPostLike(updateLikes); 
             const updatedPostData = posts.map(p=>
              p._id===post._id?{...p,likes:liked?p.likes.filter(id=>id!=user._id) : [...p.likes,user._id]}:p
             )
             dispatch(setPosts(updatedPostData));
             setLiked(!liked);
             toast.success(res.data.message);
           }                    
        }
       catch(error)
        {
          console.log(error);
        } 
     }  
     
   const deletePostHandler = async ()=>
     {
        try
         {
           const res = await api.delete(`/post/delete/${post._id}`);
           if(res.data.success)
            {
              const updatePostData = posts.filter((postItem)=>
               postItem?._id!==post?._id);
              dispatch(setPosts(updatePostData));
              toast.success(res.data.message);
            }                  
         }
        catch(error)
         {
           console.log(error);
           toast.error(error.response.data.message);
         }   
     }  
     
   const bookmarkHandler = async()=>
    {
      try
       {
         const res = await api.get(`/post/${post?._id}/bookmark`);
         if(res.data.success)
          {
            const updatedBookmarks = isBookmarked
            ? user?.bookmarks.filter(id => id !== post._id)
            : [...user?.bookmarks, post._id];
            dispatch(setAuthUser({ ...user, bookmarks: updatedBookmarks }));
            setIsBookmarked(!isBookmarked);
            toast.success(res.data.message);
          }
       }
      catch(error)
       {
        console.log(error);
       }  
    } 
    
    const followOrUnfollowHandler = async()=>
     {
       try
        {
          const res = await api.post(`/user/followorunfollow/${post?.author?._id}`);
          if (res.data.success) {
            
          const newFollowing = isFollowing
          ? user.following.filter(id => id !== post?.author?._id)
            : [...user.following, post?.author?._id];
          dispatch(setAuthUser({ ...user, following: newFollowing }));
          
           setIsFollowing(!isFollowing);
           toast.success(res.data.message);
          } else {
            toast.error(res.data.message);
           }
        }
       catch(error)
        {
         console.log(error);
        }  
     } 
   
    
   return (
    <div className={`mb-9 mt-4 w-full max-w-sm mx-auto p-1`}>
      <div className='flex items-center justify-between px-1 gap-2'>
        <div className='flex items-center gap-2 cursor-pointer'> 
         <Link to={`/profile/${post?.author?._id}`}>
           <Avatar className='text-black'>
            <AvatarImage src={post?.author?.profilePicture} alt='Post_image'/>
            <AvatarFallback>{post?.author?.username?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
           </Avatar>
         </Link>
         <Link to={`/profile/${post?.author?._id}`}>
           <h1>{post?.author?.username}</h1>
         </Link>
         {user?._id===post?.author?._id&&<Badge variant='secondary'>Author</Badge>}
         </div>
         <div className='flex items-center justify-between'>
            <Dialog className='bg-zinc-200'>
                <DialogTrigger asChild>
                    <MoreHorizontal className='cursor-pointer'/>
                </DialogTrigger>
                <DialogContent className='flex flex-col items-center text-sm text-center'>
                    { user?._id!==post?.author?._id&&
                      <Button variant='ghost' className={`cursor-pointer w-full hover:bg-zinc-400 text-[#ED4956] font-bold
                     border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 
                     focus-visible:ring-offset-0 shadow-none  ${!isFollowing&&'text-blue-500'}
                     `}
                     onClick={followOrUnfollowHandler}
                     >
                        {isFollowing?'Unfollow':'Follow'}
                    </Button>}
                    <Button variant='ghost' className='cursor-pointer w-full hover:bg-zinc-400 text-black'
                      onClick={bookmarkHandler}
                     >
                        {isBookmarked?'Remove From Favourites':'Add To Favourites'}
                    </Button>
                   { user&&user?._id==post?.author?._id&&
                     <Button variant='ghost' className='cursor-pointer w-full hover:bg-zinc-400 text-[#ED4956] ' onClick={deletePostHandler}>
                        Delete
                    </Button> }
                </DialogContent>
            </Dialog>
         </div>
      </div>
      
      <img src={post?.image}//'https://www.pixelstalk.net/wp-content/uploads/2016/07/Desktop-hd-3d-nature-images-download.jpg'
         className='rounded-sm my-2 w-8000px h-8000px object-contain mx-auto border-y border-zinc-400  cursor-pointer'
          onClick={() => {
            dispatch(setSelectedPost(post));
            if(isMobile) {
             navigate(`/${post._id}/comments`);
            } else {
            setOpen(true);
              }
           }} />
      
      <div className='flex items-center justify-between my-2 px-2'>
       <div className='flex items-center gap-3'>
         {liked?<FaHeart size={'22px'} className='cursor-pointer text-red-600' onClick={likeOrDislikeHandler}/>
           :<FaRegHeart size={'22px'} onClick={likeOrDislikeHandler}/>}
         <MessageCircle onClick={() => {
          dispatch(setSelectedPost(post));
          if (isMobile) {
            navigate(`/${post._id}/comments`);
           } else {
          setOpen(true);
            }
          }}
 className='cursor-pointer hover:text-gray-600'/>
         <Send className='cursor-pointer hover:text-gray-600'/>
       </div>
         {
           isBookmarked?
           <FaBookmark onClick={bookmarkHandler} className='cursor-pointer w-6 h-6 hover:text-gray-500'/>
           :
           <Bookmark onClick={bookmarkHandler} className='cursor-pointer w-6 h-6 hover:text-gray-600'/>
         }
      </div>   
      
     {post?.likes ? (
         <span className='font-medium block mb-2 px-2'>
          {postLike?`${postLike} likes`:""}
         </span> ) : null}
         
     <p>
        <span className='font-medium mr-1 px-2 '>
         {post?.author?.username}
        </span>
         {post?.caption}
     </p>
        {post?.comments?.length?
        <span  onClick={() => {
            dispatch(setSelectedPost(post));
            if(isMobile) {
             navigate(`/${post._id}/comments`);
            } else {
            setOpen(true);
              }
           }}
        className='cursor-pointer text-sm px-2 text-gray-400'>
          {`View all ${post?.comments?.length} Comments`}
         </span>
        :null}
     <CommentDialog open={open} setOpen={setOpen} post={post}/>
     <div className='flex justify-between mx-2 px-2'>
        <input type='text' placeholder='Add a Comment...'
          value={text} onChange={changeEventHandler} 
          className='outline-none text-sm w-full'/>
        {
          text&&<span className='text-[#3BADF8] cursor-pointer' onClick={commentHandler}>Post</span>
        }
     </div>
       
    </div>
  )
}