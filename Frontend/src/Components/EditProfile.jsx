import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { Button } from './ui/button.jsx';
import { Textarea } from './ui/textarea.jsx';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/Lib/api.js';
import { setAuthUser, setUserProfile } from '@/Redux/authslice.js';
import { readFileAsDataURL } from '@/Lib/utils.js';
import heic2any from "heic2any";

export default function EditProfile() {
  const {user} = useSelector(store=>store.auth);
  const [loading,setLoading] = useState(false);
  const imageRef = useRef();
  const [input,setInput] = useState({
    profilePicture : user?.profilePicture , bio : user?.bio , gender : user?.gender });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  
  // const [file,setFile] = useState("");
  const [imagePreview,setImagePreview] = useState("");
  
  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 690);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);
  

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
      console.log("Detected HEIC/HEIF file, converting...");
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });

      processedFile = new File(
        [convertedBlob],
        file.name.replace(/\.[^/.]+$/, ".jpeg"),
        { type: "image/jpeg" }
      );
    }
   setInput({
      ...input,
      profilePicture: processedFile,
    });
    const dataUrl = await readFileAsDataURL(processedFile);
    setImagePreview(dataUrl);
  } catch (err) {
    console.error("Error converting HEIC/HEIF:", err);
    toast.error("Failed to preview image. Please try another format.");
  }
};

 
  const selectChangeHandler = (value)=>
    {
      setInput({...input,gender:value});
    } 
   
  const editProfileHandler = async()=>
   {
     setLoading(true);
     const formData = new FormData();
     formData.append('bio',input.bio);
     formData.append('gender',input.gender);
     if(input?.profilePicture)
      {formData.append('profilePicture',input.profilePicture);}
     try
      {
        console.log(formData);
        const res = await api.post('/user/profile/edit', formData, {
            headers : {
              'Content-Type':'multipart/form-data'
            }
          }
        );
        if(res.data.success)
         {
          console.log(res?.data?.user?.profilePicture);
          const updatedUserData = {...user , bio : res?.data?.user?.bio ,
              profilePicture : res?.data?.user?.profilePicture ,
              gender : res?.data?.user?.gender
           };
           
          dispatch(setAuthUser(updatedUserData));
          // dispatch(setUserProfile(updatedUserData));
          navigate(`/profile/${user?._id}`);          
          toast.success(res.data.message);
         }     
      }
     catch(error)
      {
        console.log(error);
        toast.error(error.response.data.message);
      }
     finally 
      {setLoading(false);}  
   }
  
  return (
    <div className={`flex max-w-2xl mx-auto ${isMobile?'p-2':'pl-10'}`}>
      <section className='flex flex-col gap-6 w-full my-8'>
        <h1 className='font-bold text-xl'>
          Edit Profile
        </h1>
        <div className={`flex ${isMobile|true ? "flex-col items-start" : "items-center justify-between"}
         gap-3 border rounded-xl p-4`}>
        <div className={`flex ${isMobile||true ? "flex-col items-start w-full" 
          :"flex-row items-center"} gap-3`}>
        <div className="flex items-center gap-3">
          <Avatar className="text-black">
            <AvatarImage src={user?.profilePicture} alt="Profile_image" />
            <AvatarFallback>
              {user?.username?.slice(0, 2)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        <div>
         <h1 className="font-bold text-sm">{user?.username}</h1>
          <span className={`${!isMobile && "text-gray-600"}`}>
           {user?.bio || "Bio Here"}
          </span>
         </div>
        </div>

      {imagePreview && (
        <div className={`${isMobile||true ? "w-full mt-3" : "w-64 ml-3"} 
           h-64 flex items-center justify-center`} >
          <img className="object-cover h-full w-full rounded-md"
            src={imagePreview} alt="Preview_Image" />
        </div>
      )}
    </div>

     <div className={`${isMobile||true ? "w-full mt-3" : "ml-2"}`}>
      <input
        ref={imageRef}
        type="file"
        className="hidden"
        onChange={fileChangeHandler}/>
      <Button
       onClick={() => imageRef?.current.click()}
       className="bg-[#0095F6] h-8 hover:bg-[#318bc7] w-full">
       Change Photo
      </Button>
      </div>
    </div>
    <div>
      <h1 className='font-bold text-xl mb-2'>
        Bio 
      </h1>
      <Textarea name='bio' className='focus-visible:ring-transparent'
         value={input.bio} onChange = {(e)=> setInput({...input,bio:e?.target?.value})}
       />
    </div>
     <div>
      <h1 className='font-bold mb-2'>Gender</h1>
      <Select defaultValue={input?.gender}
         onValueChange={(value)=>selectChangeHandler(value)}>
        <SelectTrigger className='w-full'>
          <SelectValue/>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value='male'>Male</SelectItem>
            <SelectItem value='female'>Female</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
     </div>
    <div className='flex justify-end'>
      {loading?
        (
         <Button className='w-fit bg-[#2a8ccd]'>
           <Loader2 className='mr-2 h-4 w-4 animate-spin'/>
           Please Wait
         </Button>
        )
        :
       (
        <Button className='w-fit bg-[#0095f6] hover:bg-[#2a8ccd]'
              onClick={editProfileHandler}>
          Submit
        </Button>
        )
      }
     </div>
    </section>
   </div>
  )
}
