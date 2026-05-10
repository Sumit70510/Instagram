import { setSuggestedUsers } from '@/Redux/authslice.js';
import api from '../Lib/api.js';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

export default function useGetSuggestedUsers() {
   const dispatch = useDispatch();
   useEffect(()=>{
      const fetchSuggestedUsers = async ()=>{
        try
         {
           const res = await api.get('/user/suggested');
           if(res.data.success)
            {
              // console.log(res.data.users);  
              dispatch(setSuggestedUsers(res.data.users));  
            }  
         }
        catch(error)
         {
           console.log(error); 
         }
        }
        fetchSuggestedUsers();}
       ,[dispatch]); 
}
