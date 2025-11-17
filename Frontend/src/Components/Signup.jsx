import React,{useEffect, useState} from 'react';
import { Button } from './ui/button.jsx';
import {Input} from './ui/input.jsx'
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function Signup() 
 {
    
   const [input,setInput] = useState({
     username : "", email : "" , password : "" }); 
   
   const [loading,setloading]=useState(false);  
  
   const navigate = useNavigate();
   const {user} = useSelector(store=>store.auth);   
   
   const changeEventHandler = (e)=>
     {
      setInput({...input,[e.target.name]:e.target.value})
     }  
   
       
   const signupHandler = async(e)=>
    { 
      e.preventDefault();
      try
       {
          setloading(true);
          const res = await axios.post('/api/v1/user/register',input,{
                headers : { "content-type" : 'application/json' },
                withCredentials : true });    
          if(res.data.success)
           {
             navigate('/login');
             toast.success(res.data.message);
             setInput({username : "", email : "" , password : "" }) 
           }    
       }
      catch(e)
       {
         // console.log(e); 
         toast.error(e.response?.data?.message || "Something Went Wrong");
       }
       finally
       {
        setloading(false); 
       }
    }  
    
   useEffect(()=>
     {
      if(user)
       {navigate('/');}  
     }
     ,[]); 
    
   return (
     <div className='flex items-center w-screen h-screen justify-center bg-linear-to-r from-[#141E30] to-[#243B55]'>
        <form className='shadow-lg flex flex-col gap-5 p-4 bg-white text-black border  rounded-lg mx-1 ' onSubmit={signupHandler}>
           <div className='my-4 flex flex-col items-center'>
             <img src='/Black.png' className='w-30 h-12'/>
             <p className='text-sm text-center'>
               Signup To See Photos & Videos From Your Friends 
             </p>
           </div>
           <div>
            <span  className='font-medium my-2'>
             Username
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300'
             type='text' name='username' value={input.username} onChange={changeEventHandler}/> 
           </div>  
           <div>
            <span  className='font-medium my-2'>
             Email
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300'
             type='email' name='email' value={input.email} onChange={changeEventHandler}/> 
           </div>  
           <div>
            <span  className='font-medium my-2'>
             Password
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300'
             type='password' name='password'value={input.password} onChange={changeEventHandler}/> 
           </div>
           {
             loading?(<Button>
                       <Loader2 className='mr-2 h-4 w-4 animate-spin'/> 
                         Please Wait...                
                      </Button>)
              : (<Button type='submit'>SignUp</Button>)
             }  
           <span className="text-center">
            Already Have an Account ?
            <Link to='/login' className='text-blue-600'> Login</Link> 
           </span> 
        </form>
     </div>
   )
 }