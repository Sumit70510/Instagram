import {User} from "../Models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/DataUri.js";
import cloudinary from "../utils/cloudinary.js";
import {Post} from '../Models/post.model.js';
import Session from "../Models/session.model.js";
import crypto from "crypto";

const tokenName = process.env.TOKEN||"jwt-insta";
const tokenAge =  (parseInt(process.env.VALID_TILL)||2)*2*24*60*60*1000;
   
const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== 'DEVELOPMENT'
    };

export const register = async(req,res)=>
  {
    try{
        const {username,email,password}=req.body;
        if(!username||!email||!password)
         {
           return res.status(401).json({
            message:"Something is Missing, Please Check !",
            success:false
           });
         }
        const user= await User.findOne({$or: [{ email }, { username }]});
        
        if(user)
         {
           return res.status(409).json({
            message:"User Already Exists",
            success:false
           }); 
         }  
         
        const rounds =  parseInt(process.env.SALT_ROUND)||10; 
        const salt = await bcrypt.genSalt(rounds);
        const hashedPassword = await bcrypt.hash(password,salt);
         
        const newUser = await User.create({
            username,
            email,
            password:hashedPassword
        })       
        return res.status(201).json({
            message : "Account Created Successfully",
            success : true
        });
     }
    catch(error)
     {
       console.log(error); 
       return res.status(500).json({ message: "Internal Server Error", success: false }); 
     }
  }

// have doubt  
export const login = async(req,res)=>
  {
     try
      {
        const {username,email,password,force}=req.body;
        const sessionLimit = parseInt(process.env.SESSION_LIMIT)||1; 
        let message;
        if((!email&&!username)||!password)
         {
           return res.status(400).json({
            message:"Something is Missing, Please Check !",
            success:false
           });
         }
         
        const query = email ? { email } : { username };
        
        const user = await User.findOne(query).select("+password");
        
        if(!user)
         {
           return res.status(400).json({
            message:"Incorrect Credentials",
            success:false
           }); 
         }  
         
        const isPasswordMatch = await bcrypt.compare(password,user.password);
        if(!isPasswordMatch) 
         {
           return res.status(400).json({
            message:"Incorrect Credentials",
            success:false
           });   
         }   
         
         const existingSession = await Session.findOneAndUpdate(
               {userId : user._id ,isActive : true,
                "deviceInfo.userAgent": req.headers["user-agent"]},{isActive:false});
                
         const activeSessions = await Session.find({userId : user._id ,isActive :true});
        //  console.log(activeSessions.length," ",sessionLimit);
        //  console.log(existingSession?'E':'NE')
         if((activeSessions.length+1) > sessionLimit && !force)
           {
            //  if(!existingSession)
            //   {
                return res.status(200).json({
                 message : "Logout From Other Device To Continue Here? ",
                 success : false,
                 requireConfirmation: true
                });
              // }
           }
         
         const populatedPosts = user.posts?.length
           ? await Post.find({ _id: { $in: user.posts }, author: user._id }).sort({ createdAt: -1 })
           : []; 

         const userPayload = user.toObject();
         delete userPayload.password;
         userPayload.posts = populatedPosts;
                 
         
        //  if(existingSession) { 
        //         message = `!!`; 
        //         await Session.updateOne(
        //          {_id: existingSession._id },
        //          {isActive: false });
        //     }    
       
         if((activeSessions.length+1)>sessionLimit&&force){
          // console.log(' F');
          //  message="!"
           const extraSessions = activeSessions
            .sort((a, b) => a.createdAt - b.createdAt) // oldest first
            .slice(0, activeSessions.length - sessionLimit + 1);
           const ids = extraSessions.map(s => s._id);
            await Session.updateMany(
               { _id: { $in: ids } },
               { isActive: false } );
           }
         
         const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY,
                       {expiresIn:`${process.env.VALID_TILL||2}d`});
         
         const hashedToken = crypto
           .createHash("sha256")
           .update(token)
           .digest("hex");
         
         await Session.create({
           userId: user._id,                 
           token: hashedToken,
           deviceInfo: {
           userAgent: req.headers["user-agent"] ,
            // deviceName: "Unknown"
           },
            ip: req.headers["x-forwarded-for"] || req.ip,
            expiresAt: new Date(Date.now() + tokenAge)
          });
        return res.cookie(tokenName,token,{...cookieOptions,maxAge:tokenAge})
        .json({
            message : `Welcome Back ${user.username}`+(message||""),
            success : true,
            user: userPayload 
        });
      }
     catch(error)
      {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
      }     
  } 
  
export const logout = async(req,res)=>
  {
    try
     {
       const token = req.cookies[tokenName];
       res.clearCookie(tokenName,cookieOptions);
       if(!token)
       {
         res.clearCookie(tokenName,cookieOptions);
         return res.status(401).json({
           message : 'User Not Authenticated',
           success : false 
         });
       }
       const hashedToken = crypto.createHash("sha256")
                                 .update(token)
                                 .digest("hex");
                                 
       const session = await Session.findOneAndUpdate({token : hashedToken 
                        ,isActive : true},{isActive : false});                         
       
       if(!session)
        {
          return res.json({
             message : "Expired Session",
             success : true
          })
        }                 
       return res.json({
         message : "Logged Out Successfully",
         success : true
        });  
     }
    catch(error)
     {
       console.log(error); 
       return res.status(500).json({ message: "Internal Server Error", success: false }); 
     }    
  }

export const logoutFromAll = async(req,res)=>{
    try
     { 
       res.clearCookie(tokenName,cookieOptions);
       const userId = req.id;
       const result = await Session.updateMany({ userId: userId , isActive :true },
           { isActive: false });
   
        
       return  res.status(200).json({
          message : "Logged Out From All Devices",
          success : true 
        });
     }
    catch(error)
     {
       console.log(error);
       return res.status(500).json({message : "Internal Server Error", success : false});
     }
 } 
  
export const getProfile = async(req,res)=>
  {
      try
       {
         const userId=req.params.id;
         let user =  await User.findById(userId).select("-password").populate({path:'posts',createdAt:-1}).populate('bookmarks');
         if(!user)
          {
           return res.status(400).json({
            message:"No Such User Exists",
            success:false
           }); 
          }  
         return res.status(200).json({
            user,
            success:true
         })
       }
      catch(error)
       {
         console.log(error);
         return res.status(500).json({ message: "Internal Server Error", success: false }); 
       }   
  }
   
export const editProfile = async(req,res)=>
  {
    try
     {
       const profilePicture=req.file;
       const userId=req.id;
       const {bio,gender}=req.body;
       let cloudResponse;
       if(profilePicture)
        {
          const fileUri = getDataUri(profilePicture);
          cloudResponse = await cloudinary.uploader.upload(fileUri);
        }
       const user = await User.findById(userId).select("-password");
       if(!user)
         {
            return res.status(404).json({
                message : "User Not Found",
                success : false
            });
         }
       if(bio) user.bio=bio;
       if(gender) user.gender=gender;
       if(profilePicture) user.profilePicture=cloudResponse.secure_url;
       await user.save();
       return res.status(200).json({
         message : "Profile Updated",
         success : true,
         user
       });   
     }
    catch(error)
     {
      console.log(error);  
      return res.status(500).json({ message: "Internal Server Error", success: false });  
     }       
  } 
  
export const getSuggestedUsers = async (req,res) => 
  {
     try
      {
        const suggestedUsers = await User.find({_id:{$ne:req.id}}).select("-password");
        if(suggestedUsers.length===0)
         {
           return res.status(400).json({
             message : "Currently Don't Have Any Suggested Users",
             success : false
           })   
         }
        return res.status(200).json({
             success : true ,
             users : suggestedUsers        
         });    
      }
     catch(error)
      {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
      }   
  }  
  
export const followOrUnfollow = async(req,res) =>
  {
     try
      {
        const follower=req.id;  //logged in user
        const followed=req.params.id;
        if(follower===followed)
         {
           return res.status(400).json({
            message : "You Can't Follow/Unfollow Yourself",
            success : false
           }); 
         }
        const user = await User.findById(follower);
        const targetUser = await User.findById(followed);
        if(!user||!targetUser)
         {
           return res.status(400).json({
             message : "User Not Found",
             success : false
           }); 
         }
         const isfollowing = user.following.includes(targetUser._id);
         let str="No Response"; 
        if(isfollowing)
         {
           await Promise.all([
             User.updateOne({_id:user._id},{$pull:{following : targetUser._id}}),
             User.updateOne({_id:targetUser._id},{$pull:{followers: user._id}})
           ]);
           str="Unfollowed Successfully";
         }
        else
         {
           await Promise.all([
             User.updateOne({_id:user._id},{$addToSet:{following:targetUser._id}}),
             User.updateOne({_id:targetUser._id},{$addToSet:{followers:user._id}})
           ])
           str="Followed Successfully";
         }          
        return res.status(200).json({
          message : str,
          success : true
        }); 
     }
    catch(error)
     {
       console.log(error);
       return res.status(500).json({ message: "Internal Server Error", success: false });
     }    
  }  

export const searchUsers = async(req,res) =>
  {
    try
     {
       const { query } = req.query;
       
       if(!query || query.trim() === "")
        {
          return res.status(400).json({
            message: "Search query is required",
            success: false
          });
        }

       const users = await User.find({
         username: { $regex: query, $options: "i" }
       }).select("-password");

       if(users.length === 0)
        {
          return res.status(200).json({
            message: "No users found",
            success: true,
            users: []
          });
        }

       return res.status(200).json({
         success: true,
         users
       });
     }
    catch(error)
     {
       console.log(error);
       return res.status(500).json({ message: "Internal Server Error", success: false });
     }
  }