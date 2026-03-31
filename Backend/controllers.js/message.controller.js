import { Conversation } from "../Models/conversation.model.js";
import { Message } from "../Models/message.model.js"
import { getRecieverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req,res)=>
 {
   try 
    {
      const senderId   = req.id;
      const recieverId = req.params.id;
      const {message}  = req.body;
      
      let conversation = await Conversation.findOne({participants:{$all:[senderId,recieverId]}});
      
      if(!conversation)
       {conversation= await Conversation.create({participants:[senderId,recieverId],messages:[]});}
      
      const newMessage = await Message.create({senderId,recieverId,message});
      
      if(newMessage) 
       {conversation.messages.push(newMessage._id);}
      
      await Promise.all([conversation.save(),newMessage.save()]);
      
      //Implement socket.io for real time data Transfer
      const recieverSocketId = getRecieverSocketId(recieverId);
      
      if(recieverSocketId)
       {
         io.to(recieverSocketId).emit('newMessage',newMessage);
       }
      
      return res.status(201).json({
        success : true,
        newMessage });
       
    } 
   catch(error)
    {
      console.log(error);
      res.status(500).json({message:'Internal Server Error',success:false});  
    } 
 }
 
export const getMessage = async(req,res)=>
 {
    try 
     {
       const senderId=req.params.id;
       const recieverId=req.id;
       const conversation = await Conversation.findOne({participants:{$all:[senderId,recieverId]}})
                            .populate("messages");
                            //  path: "messages",
                            //  populate: {
                            //     path: "senderId", 
                            //     select: "username , profilePicture"
                            //        } });
       
       if(!conversation)
        { return res.status(200).json({
            success : true,
            messages : []
          }); }
       
       return res.status(200).json({
        success : true,
        messages : conversation.messages });      
     
      }
    catch(error)
     {
       console.log(error);
       res.status(500).json({message:'Internal Server Error',success:false});  
     }  
 }

export const getAllConversations = async(req,res)=>
 {
    try 
     {
       const userId = req.id;
       
       const conversations = await Conversation.find({participants:userId})
                              .populate({
                                 path: "participants",
                                 select: "username profilePicture bio followers _id",
                                 match: {_id: {$ne: userId}}
                              })
                              .populate({
                                 path: "messages",
                                 options: { sort: {createdAt: -1}, limit: 1 }
                              })
                              .sort({updatedAt: -1});
       
       if(!conversations || conversations.length === 0)
        { 
          return res.status(200).json({
             success: true,
             conversations: []
          }); 
        }
       
       return res.status(200).json({
          success: true,
          conversations
       });
     }
    catch(error)
     {
       console.log(error);
       res.status(500).json({message:'Internal Server Error',success:false});  
     }  
 }