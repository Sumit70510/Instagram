import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
    name : String ,
    
    username : {type : String , required : true ,unique : true },
    
    email : {type: String , required : true ,unique : true } ,
    
    password : {type : String, required : true ,select : false} ,
    
    profilePicture : {type : String,default : "/default.jpg" } ,
    
    bio : {type : String,default : ""},
    
    gender : {type : String,enum : ['male','female']} ,
    
    followers :[{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }],
    
    following : [ {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }],
    
    posts : [ {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Post"   
    }],
    
    bookmarks : [ {
       type : mongoose.Schema.Types.ObjectId,
       ref : "Post"   
    }]
    
  }  
 ,{timestamps:true}
);

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});


export const User = mongoose.model("User",userSchema); 