import { setUserProfile } from "@/Redux/authslice.js";
import api from "../Lib/api.js";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function useGetUserProfile(userId) {
  //  const [userProfile,setUserProfile] = useState(null);
   const dispatch = useDispatch();
   useEffect(()=>{
      const fetchUserProfile = async ()=>{
        try
         {
           const res = await api.get(`/user/${userId}/profile`);
           if(res.data.success)
            {
              console.log(res.data.user);  
              dispatch(setUserProfile(res.data.user));  
            }  
         }
        catch(error)
         {
           console.log(error); 
         }
        }
        fetchUserProfile();}
       ,[userId,dispatch]); 
}
