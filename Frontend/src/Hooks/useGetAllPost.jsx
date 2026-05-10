import { setPosts } from '@/Redux/postSlice.js';
import api from '../Lib/api.js';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

export default function useGetAllPost() {
   const dispatch = useDispatch();
   useEffect(()=>{
      const fetchAllPost = async ()=>{
        try
         {
           const res = await api.get('/post/all');
           if(res.data.success)
            {
              // console.log(res.data.posts);  
              dispatch(setPosts(res.data.posts));  
            }  
         }
        catch(error)
         {
           console.log(error); 
         }
        }
        fetchAllPost();}
       ,[dispatch]); 
}
