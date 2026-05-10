import {User} from "../Models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/DataUri.js";
import cloudinary from "../utils/cloudinary.js";
import {Post} from '../Models/post.model.js';

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
        const hashedPassword = await bcrypt.hash(password,10); 
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
        const {email,password}=req.body;
        
        if(!email||!password)
         {
           return res.status(400).json({
            message:"Something is Missing, Please Check !",
            success:false
           });
         }
        let user = await User.findOne({email});
        
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
         
         const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY,{expiresIn:'1d'});
         
         const populatedPosts= await Promise.all(
           user.posts.map(async(postId)=>{
            const post = await Post.findById(postId);
             if(post.author.equals(user._id))
               {return post;}
             return null; 
           })) 
      //    const populatedBookmarks = await Promise.all(
      //     user.bookmarks.map(async (postId) => {
      //     return await Post.findById(postId);
      //  })
      //   );  
         user={
             _id : user._id,
             name : user.name,
             gender : user.gender,
            username : user.username,
            email : user.email,
            profilePicture : user.profilePicture,
            bio : user.bio,
            followers : user.followers,
            following : user.following,
            posts : populatedPosts,
            bookmarks:user.bookmarks
         }
        
        return res.cookie('token',token,{httpOnly:true,sameSite:'strict',maxAge:1*24*60*60*1000})
        .json({
            message : `Welcome Back ${user.username}`,
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
  
export const logout = async(req,res)=>
  {
    try
     {

       return res.clearCookie("token",
         {httpOnly: true,sameSite: "strict"})
        .json({
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