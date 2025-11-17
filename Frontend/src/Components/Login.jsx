import React,{useEffect, useState} from 'react';
import { Button } from './ui/button.jsx';
import {Input} from './ui/input.jsx'
import axios from 'axios';
import { toast } from 'sonner';
import {Link, useNavigate} from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '../Redux/authslice.js';


export default function Login() {
    
   const [input,setInput] = useState({
    email : "" , password : "" }); 
   
   const [loading,setloading]=useState(false);  
   
   const navigate = useNavigate();
   const dispatch = useDispatch();
   const {user} = useSelector(store=>store.auth);
   
   const changeEventHandler = (e)=>
     {
      setInput({...input,[e.target.name]:e.target.value})
     }  
   
 const loginHandler = async(e) => { 
  e.preventDefault();
  
  try 
   {
    setloading(true);
    const res = await axios.post(
      '/api/v1/user/login',
      input,
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
      ); 
      if (res.data.success) {
       navigate('/');
       dispatch(setAuthUser(res.data.user));
       toast.success(res.data.message);
       setInput({ email: "", password: "" });
      }
    } catch(e){
    // console.error(e);
    toast.error(e.response?.data?.message || "Something Went Wrong");
   }finally {
    setloading(false);
   }
  };
  
   const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 690);
       window.addEventListener('resize', handleResize);
       return () => window.removeEventListener('resize', handleResize);
      }, []);
  
  useEffect(()=>
     {
      if(user)
       {
         navigate('/')
       }  
     }
     ,[]);
  
   return(
     <div className={`flex items-center w-screen h-screen justify-center ${'bg-linear-to-r from-[#141E30] to-[#243B55]'}`}>
        <form className={`shadow-lg flex flex-col gap-5 p-4 ${
        'bg-white text-black border  rounded-lg mx-1'}`} 
        onSubmit={loginHandler}>
           <div className='my-4 flex flex-col items-center'>
             <img src='/Black.png' className='w-30 h-12'/>
             <p className='text-sm text-center'>
               Login To See Photos & Videos From Your Friends 
             </p>
           </div>  
           <div>
            <span  className='font-medium my-2'>
             Email
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300 '
             type='email' name='email' value={input.email} onChange={changeEventHandler}/> 
           </div>  
           <div>
            <span  className='font-medium my-2'>
             Password
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300 '
             type='password' name='password'value={input.password} onChange={changeEventHandler}/> 
           </div>
            {
             loading?(<Button>
                       <Loader2 className='mr-2 h-4 w-4 animate-spin'/> 
                         Please Wait...                
                      </Button>)
              : (<Button type='submit'>Login</Button>)
             }  
            <span className="text-center">
            Doesn't Have an Account ?
            <Link to='/signup' className='text-blue-600'> SignUp</Link>
            </span> 
        </form>
     </div>
    )
}
