import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Messages from "@/components/Messages.jsx";
import { setSelectedUser } from "@/Redux/authslice.js";
import axios from "axios";
import { toast } from "sonner";
import { setMessages } from "@/Redux/chatSlice.js";
import { useNavigate } from "react-router";

export default function MobileChatPage() {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((store) => store.auth);
  const { messages } = useSelector((store) => store.chat);

  const [textMessage, setTextMessage] = useState("");
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  
   useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 690);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        // dispatch(setMessages(null));
        // dispatch(setSelectedUser(null));
        // setTextMessage("");
      };
    }, []); 

const sendMessageHandler = async (recieverId) => {
    if (!textMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    try {
      const res = await axios.post(`/api/v1/message/send/${recieverId}`,
        { message: textMessage },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
      if (res.data.success) {
        dispatch(setMessages([...(Array.isArray(messages) ? messages : []), res.data.newMessage]));
        setTextMessage("");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <section className="flex flex-col h-full justify-between text-white bg-zinc-900">

      {/* Header */}
      <div className="flex gap-3 items-center px-3 py-2 fixed w-full border-b border-zinc-700 bg-zinc-900 z-9">
        <button
          className="text-lg font-bold mr-2 cursor-pointer"
          onClick={() => {
            dispatch(setMessages([]));         // 🔥 Clear previous chat
            dispatch(setSelectedUser(null));   // Go back
            navigate(-1);
          }}
        >
          <ArrowLeft />
        </button>

        <Avatar className="w-12 h-12 text-black">
          <AvatarImage src={selectedUser?.profilePicture} alt="Profile_image" />
          <AvatarFallback>
            {selectedUser?.username?.slice(0, 2)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <span>{selectedUser?.username}</span>
        </div>
      </div>

      {/* Messages */}
      <Messages selectedUser={selectedUser} />

      {/* Input */}
      <div className="flex fixed items-center py-3 bottom-0 border-t border-t-zinc-700 px-2 bg-zinc-900 w-full">
        <input
          type="text"
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          className="flex-1 ml-2 mr-2 focus-visible:ring-transparent border border-zinc-700 rounded-lg px-2 py-1"
          placeholder="Type your message here..."
        />

        <Button
          onClick={() => sendMessageHandler(selectedUser?._id)}
          className="bg-white text-black mr-1"
        >
          Send
        </Button>
      </div>
    </section>
  );
}
