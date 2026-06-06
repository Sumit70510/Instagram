import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import connectDB from './utils/db.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import messageRoutes from './routes/message.routes.js';
import storyRoutes from './routes/story.routes.js';
import { app,server,io } from './socket/socket.js';
import path from 'path';

dotenv.config();
app.use(express.json()); 
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
 
const corsOption={
    origin : process.env.URL,
    credentials : true,  
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
const __dirname=path.resolve(); 

app.use(cors(corsOption));
const PORT=process.env.PORT||3000;


app.use('/api/v1/user',userRoutes);
app.use('/api/v1/post',postRoutes);
app.use('/api/v1/message',messageRoutes);
app.use('/api/v1/story',storyRoutes);


if(process.env.NODE_ENV==='PRODUCTION')
  { 
   app.use(express.static(path.join(__dirname, './Frontend/dist')));
   app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, './Frontend/dist', 'index.html'));
   });
 }
else
 {
   app.get("/",(req,res)=>{
    return res.status(200).json({
        message :'I\'m Coming From Backend',
        success : true
     })
    });
 }  
 

server.listen(PORT, () => {
  connectDB();
  console.log(`Server Listen To Port ${PORT}`);
});
