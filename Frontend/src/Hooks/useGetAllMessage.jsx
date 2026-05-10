import { setMessages } from "@/Redux/chatSlice.js";
import api from "../Lib/api.js"; 
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useGetAllMessage() {
   const dispatch = useDispatch();
   const {selectedUser} = useSelector(store=>store.auth);
   useEffect (()=>{
      const fetchAllMessage = async ()=>{
        try
         {
           const res = await api.get(`/message/all/${selectedUser?._id}`);
           if(res.data.success)
            {
              // console.log(res.data.posts);  
              dispatch(setMessages(res.data.messages));  
            }  
         }
        catch(error)
         {
           console.log(error); 
         }
        }
        fetchAllMessage();}
       ,[selectedUser]); 
}
