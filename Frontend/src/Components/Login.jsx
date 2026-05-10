import React,{useEffect, useState} from 'react';
import { Button } from './ui/button.jsx';
import {Input} from './ui/input.jsx'
import api from '../Lib/api.js';
import { toast } from 'sonner';
import {Link, useNavigate} from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '../Redux/authslice.js';


export default function Login() {
    
   const [input,setInput] = useState({
    identifier : "" , password : "" ,force : false}); 
   
   const [loading,setloading]=useState(false);  
   const [confirm,setConfirm]=useState(false);
   
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
    const requestBody = {
      password: input.password,
      force: confirm || input.force,
      ...(input.identifier.includes('@')
        ? { email: input.identifier }
        : { username: input.identifier })
    };
    const res = await api.post(
      '/user/login',
      requestBody,
      { headers: { "Content-Type": "application/json" } }
      ); 
      if(res.data.requireConfirmation)
         {
           toast.error(res.data.message);
           setConfirm(true);
           return;
         }  
      if(res.data.success) {
       navigate('/');
       dispatch(setAuthUser(res.data.user));
       toast.success(res.data.message);
       setInput({ identifier: "", password: "" ,force :false});
       setConfirm(false);
       }
    } 
    catch(e){
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
             Email or Username
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300 '
             type='text' name='identifier' placeholder='Email or username' value={input.identifier} onChange={changeEventHandler}/> 
           </div>  
           <div>
            <span  className='font-medium my-2'>
             Password
            </span>
            <Input className='focus-visible:ring-transparent my-2  border border-zinc-300 '
             type='password' name='password' placeholder="********" value={input.password} onChange={changeEventHandler}/> 
           </div>
            {
             loading?(<Button>
                       <Loader2 className='mr-2 h-4 w-4 animate-spin'/> 
                         Please Wait...                
                      </Button>)
              : confirm ? (<Button type='submit'>Continue</Button>) : (<Button type='submit'>Login</Button>)
             }  
            <span className="text-center">
            Doesn't Have an Account ?
            <Link to='/signup' className='text-blue-600'> SignUp</Link>
            </span> 
        </form>
     </div>
    )
}
