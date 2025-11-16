import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog.jsx';
import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { useDispatch, useSelector } from 'react-redux';
import store from '@/Redux/store';
import Comment from './Comment.jsx';
import axios from 'axios';
import { setPosts, setSelectedPost } from '@/Redux/postSlice.js';
import { toast } from 'sonner';
import { setAuthUser } from '@/Redux/authslice.js';


export default function CommentDialog({open,setOpen,post}) {
  
  const [text,setText]=useState("");
  const {selectedPost,posts} = useSelector(store=>store.post);
  const [comment,setComment]=useState([]);
  const dispatch = useDispatch();
  const {user} = useSelector(store=>store.auth);
  const [isBookmarked,setIsBookmarked] = useState(false);
  const [isFollowing,setIsFollowing] = useState(false);
  
  useEffect(() => {
  // console.log("selectedPost updated:", selectedPost);
  if (selectedPost) {
    setComment(selectedPost?.comments || []);
  }
}, [selectedPost]);

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
   
  const deletePostHandler = async ()=>
     {
        try
         {
           const res = await axios.delete(`/api/v1/post/delete/${selectedPost?._id}`,
                             {withCredentials : true});
           if(res.data.success)
            {
              const updatePostData = posts.filter((postItem)=>
               postItem?._id!==selectedPost?._id);
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
   
  const sendMessageHandler = async()=>
     {
        try
         {
           const res = await axios.post(`/api/v1/post/${selectedPost?._id}/comment`,{text},
             {
              headers:{
                 "Content-Type": "application/json" 
               }, withCredentials : true
             }
            );
           if(res.data.success)
            {
              const updatedCommentData = [...comment,res.data.comment];
              setComment(updatedCommentData);
              const updatedPostData =  posts.map(p=> 
                p._id===post._id?{...p,comments:updatedCommentData}:p
               );
              const updatedSelectedPost = {
              ...selectedPost,
             comments: updatedCommentData,
              };
              dispatch(setSelectedPost(updatedSelectedPost));
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
     
   const followOrUnfollowHandler = async()=>
     {
       try
        {
          const res = await axios.post(`/api/v1/user/followorunfollow/${selectedPost?.author?._id}`,
           {withCredentials:true}
           );
          if (res.data.success) {
            
          const newFollowing = isFollowing
          ? user.following.filter(id => id !== selectedPost?.author?._id)
            : [...user.following, selectedPost?.author?._id];
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
     
   const bookmarkHandler = async()=>
    {
      try
       {
         const res = await axios.get(`/api/v1/post/${selectedPost?._id}/bookmark`,
          {withCredentials:true}
          );
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
  
  return(
   <Dialog 
  open={open} className='p-0 border-none'>
  <DialogContent 
    onInteractOutside={() => setOpen(false)}
    style={{ width: '900px', maxWidth: 'none', height: '600px' }}
    className="p-0 flex flex-col border-none w-[950px]! h-[600px] max-w-none"
  >
           <div className='flex flex-1 h-full'>
            <div className='w-1/2 h-full'>
              <img src={selectedPost?.image}
                className='w-full h-full bg-black object-contain rounded-l-lg'/>
            </div> 
            <div className='w-1/2 flex flex-col'>
              <div className='flex items-center justify-between px-4 p-4'>
                <div className='flex gap-3 items-center'>       
                <Link to={`/profile/${selectedPost?.author?._id}`}>
                 <Avatar>
                    <AvatarImage src={selectedPost?.author?.profilePicture}/>
                    <AvatarFallback>
                      {selectedPost?.author?.username?.slice(0, 2)?.toUpperCase()}
                    </AvatarFallback>
                 </Avatar>
                </Link>
                 <div>
                   <Link to={`/profile/${selectedPost?.author?._id}`}
                    className='font-semibold text-xs'> 
                     {selectedPost?.author?.username}
                   </Link> 
                   <span className='text-gray-600 text-sm'> {selectedPost?.author?.bio} </span>
                 </div>
                </div> 
              <Dialog>
                <DialogTrigger asChild>
                  <MoreHorizontal className='cursor-pointer'/>
                </DialogTrigger>
                <DialogContent className='flex flex-col items-center text-sm text-center'>
                     { user?._id!==selectedPost?.author?._id&&
                      <Button variant='ghost' className={`cursor-pointer w-full hover:bg-zinc-400 text-[#ED4956] font-bold
                      border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 
                      focus-visible:ring-offset-0 shadow-none  ${!isFollowing&&'text-blue-500'} `}
                      onClick={followOrUnfollowHandler} >
                        {isFollowing?'Unfollow':'Follow'}
                      </Button>
                      }
                     <Button variant='ghost' className='cursor-pointer w-full hover:bg-zinc-400 text-black'
                         onClick={bookmarkHandler}>
                       {isBookmarked?'Remove From Favourites':'Add To Favourites'}
                      </Button>
                    { user&&user?._id==selectedPost?.author?._id&&
                      <Button variant='ghost' className='cursor-pointer w-full hover:bg-zinc-400 text-[#ED4956]' onClick={deletePostHandler}>
                         Delete
                     </Button> }
                 </DialogContent>              
               </Dialog>
              </div>   
              <hr/>
              <div className='flex-1 overflow-y-auto max-h-auto p-4'>
                 { selectedPost?.comments?.map((comment)=>
                     <Comment key={comment._id} comment={comment}/>
                    )   
                 }
              </div>
              <div className='p-4 mt-auto'>
                <div className='flex items-center cursor-pointer  gap-1 w-full'>
                  <input type='text' placeholder='Add a Comment........'
                    onChange={changeEventHandler}
                    value={text} className='outline-none text-sm flex-1 min-w-0'/>
                  <Button disabled={!text.trim()} onClick={sendMessageHandler} 
                    variant='outline' className='shrink-0 cursor-pointer hover:bg-gray-500' >Send</Button>
                </div>
              </div>
            </div>   
           </div>
        </DialogContent>
    </Dialog>  
   )
}
