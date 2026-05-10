import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { setSelectedPost, setPosts } from "@/Redux/postSlice";
import Comment from "./Comment";
import { Button } from "./ui/button";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { setAuthUser } from "@/Redux/authslice";
import api from "@/Lib/api.js";

export default function MobileComments() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { posts, selectedPost } = useSelector((store) => store.post);
  const {user} = useSelector(store=>store.auth);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [isBookmarked,setIsBookmarked] = useState(false);
  const [isFollowing,setIsFollowing] = useState(false);
  
  useEffect(() => {
     setIsBookmarked(user?.bookmarks?.includes(post?._id));
     setIsFollowing(user?.following?.includes(post?.author?._id));
  }, [user]);
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
             ? user?.following.filter(id => id !== post?.author?._id)
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
       
    
  useEffect(() => {
    const foundPost = posts.find((p) => p._id === postId);
    if (foundPost) {
      setPost(foundPost);
      setComments(foundPost.comments || []);
      dispatch(setSelectedPost(foundPost));
    } else {
      const fetchPost = async () => {
        try {
          const res = await api.get(`/post/${postId}`);
          if (res.data.success) {
            setPost(res.data.post);
            setComments(res.data.post.comments || []);
            dispatch(setSelectedPost(res.data.post));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchPost();
    }
  }, [postId, posts, dispatch]);

  const sendMessageHandler = async () => {
    if (!text.trim() || !selectedPost) return;
    try {
      const res = await api.post(
        `/post/${selectedPost._id}/comment`,
        { text },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      if (res.data.success) {
        const updatedCommentData = [...comments, res.data.comment];
        setComments(updatedCommentData);

        const updatedPostData = posts.map((p) =>
          p._id === selectedPost._id
            ? { ...p, comments: updatedCommentData }
            : p
        );

        const updatedSelectedPost = {
          ...selectedPost,
          comments: updatedCommentData,
        };

        dispatch(setSelectedPost(updatedSelectedPost));
        dispatch(setPosts(updatedPostData));

        setText("");
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment");
    }
  };

  if (!post) return null;

  return (
     <div className={`flex min-h-screen justify-center bg-black overflow-y-hidden `}>
    <div className="bg-black text-white flex flex-col gap-2 h-full w-full box-border">

      <div className="flex fixed w-full items-center gap-3 p-4 border-b border-gray-800 top-0 bg-black z-10">
        <ArrowLeft onClick={() => navigate(-1)} className="w-6 h-6 cursor-pointer" />
        <h1 className="text-lg font-semibold">Comments</h1>
      </div>

      <div className="flex mt-14 items-center justify-between px-4 pt-3">
        <div className="flex gap-3 items-center">
          <Link to={`/profile/${post?.author?._id}`}>
            <Avatar>
              <AvatarImage src={post?.author?.profilePicture} />
              <AvatarFallback>
                {post?.author?.username?.slice(0, 2)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/profile/${post?.author?._id}`} className="font-semibold text-xs">
              {post?.author?.username}
            </Link>
            <span className="text-gray-600 text-sm"> {post?.author?.bio} </span>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <MoreHorizontal className="cursor-pointer" />
          </DialogTrigger>
          <DialogContent className="flex flex-col items-center bg-zinc-900 text-sm text-center">        
              { user?._id!==post?.author?._id&&
                 <Button variant='ghost' className={`cursor-pointer w-full hover:bg-zinc-400 text-[#ED4956] font-bold
                  border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 
                   focus-visible:ring-offset-0 shadow-none  ${!isFollowing&&'text-blue-500'}
                   `} onClick={followOrUnfollowHandler}>
                   {isFollowing?'Unfollow':'Follow'}
                 </Button>}
                 <Button variant='ghost' className='cursor-pointer w-full hover:bg-zinc-400'
                      onClick={bookmarkHandler}>
                   {isBookmarked?'Remove From Favourites':'Add To Favourites'}
                 </Button>
              { user&&user?._id==post?.author?._id&&
               <Button variant='ghost' className='cursor-pointer w-full text-[#ED4956] hover:bg-zinc-400' onClick={deletePostHandler}>
                 Delete
               </Button> }
          </DialogContent>
        </Dialog>
      </div>

      {/* Image */}
      {post?.image && (
        <div className="w-full">
          <img
            src={post.image}
            alt="post"
            className="w-full object-contain bg-black max-h-[400px]"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-scroll hide-scrollbar p-4 mb-12 space-y-3">
        {comments.length > 0 ? (
          comments.map((c) => <Comment key={c._id} comment={c} />)
        ) : (
          <p className="text-gray-500 text-center mt-10">No comments yet.</p>
        )}
      </div>

      {/* Input Bar (fixed bottom) */}
      <div className="flex fixed items-center w-full gap-2 border-t border-gray-800 p-3 bottom-0 bg-black">
        <input
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm  placeholder-red-500"
        />
        <Button
          onClick={sendMessageHandler}
          disabled={!text.trim()}
          variant="outline"
          className="text-sm shrink-0 cursor-pointer text-black"
        >
          Send
        </Button>
      </div>
     </div>
    </div>
  );
}
