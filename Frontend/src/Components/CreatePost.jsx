import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader } from './ui/dialog.jsx'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx'
import { Textarea } from './ui/textarea.jsx'
import { Button } from './ui/button.jsx';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useTheme from '@/Redux/theme.js';
import api from '@/Lib/api.js';
import { readFileAsDataURL } from '@/Lib/utils.js';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/Redux/postSlice.js';
import heic2any from "heic2any";

export default function CreatePost({open,setOpen}) {
   const [caption,setCaption] = useState(""); 
   const imageRef = useRef();
   const [file,setFile] = useState("");
   const [imagePreview,setImagePreview] = useState("");
   const [loading,setLoading] = useState(false);
   const {user} = useSelector(store=>store.auth);
   const {posts} = useSelector(store=>store.post);
   const dispatch = useDispatch();
   const { themeMode } = useTheme();
   
  const fileChangeHandler = async (e) => {
  
  const file = e?.target?.files?.[0];
  if (!file) return;
  try {
    let processedFile = file;
   if (
      file.type.includes("heic") ||
      file.type.includes("heif") ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif")
    ) {
      console.log("Detected HEIC file, converting...");
      const blob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });

      processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpeg"), {
        type: "image/jpeg",
      });
    }

    setFile(processedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(processedFile);
  } catch (err) {
    console.error("Error converting HEIC:", err);
    toast.error("Failed to preview HEIC image. Try another format.");
  }
};

  
    const createPostHandler = async(e)=>
      {
         const formData= new FormData();
         formData.append('caption',caption);
         if(imagePreview)
          {
            formData.append('image',file); 
          } 
         try{
           setLoading(true);
           const res = await api.post('/post/addpost', formData);
           if(res.data.success)
            {
              dispatch(setPosts([res.data.post,...posts]));
              toast.success(res.data.message);  
              setImagePreview("");
              setCaption("");
              setOpen(false);
            }  
         }  
        catch(error)
         {
           setImagePreview("");
           setCaption("");
           toast.error(error.response.data.message);
         }
        finally
         {
            setLoading(false);
         }  
      }
      
   return (
    <Dialog open={open} className={themeMode === 'dark' ? 'bg-black' : 'bg-gray-300'}>
      <DialogContent
        onInteractOutside={()=>setOpen(false)}
        className={themeMode === 'dark' ? 'bg-black text-slate-100 border border-zinc-800' : 'bg-white text-slate-950'}
      >
        <DialogHeader className={`text-center font-semibold ${themeMode === 'dark' ? 'text-slate-100' : 'text-black'}`}>
          Create New Post
        </DialogHeader> 
        <div className='flex gap-3 items-center'>
          <Avatar className={themeMode === 'dark' ? 'text-slate-100' : 'text-black'}>
            <AvatarImage src={user?.profilePicture} alt='img'/>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className={`font-semibold text-xs ${themeMode === 'dark' ? 'text-slate-100' : 'text-black'}`}>
              {user?.username}
            </h1>
            <span className={`font-semibold text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              {user?.bio}
            </span>
          </div>
        </div>  
        <Textarea
            value={caption} 
          onChange={(e)=>setCaption(e.target.value)}
          className={`focus-visible:ring-transparent ${themeMode === 'dark' ? 'text-slate-100 bg-zinc-900 border border-zinc-700' : 'text-black'}`}
          placeholder='Write a Caption........'
        />
         {
          imagePreview&&(
            <div className='w-full h-64 flex items-center justify-center'>
              <img className='object-cover h-full w-full rounded-md'
                src={imagePreview} alt='Preview_Image'/> 
            </div>
          )  
         } 
        <input type='file' className='hidden' ref={imageRef} onChange={fileChangeHandler}/>
        <Button className='w-full mx-auto bg-[#0095F6] hover:bg-[#045d99]' onClick={()=>imageRef.current.click()}>
         Select From Device</Button>    
        {
          imagePreview&&(
            loading?
             (
               <Button>
                <Loader2 className='mr-2 h-4 w-4 animate-spin'/>
                Please Wait.....
               </Button> 
             ):
             (
               <Button onClick={createPostHandler} type='submit' className='w-full'>
                 Post
               </Button> 
             )
           )
        } 
      </DialogContent> 
    </Dialog>
  )
}
