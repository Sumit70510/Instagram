import React, { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx'
import { Link } from 'react-router'
import { Button } from './ui/button.jsx'
import { useSelector } from 'react-redux'
import useGetAllMessage from '@/Hooks/useGetAllMessage.jsx'
import useGetRTM from '@/Hooks/useGetRTM.jsx'

export default function Messages({ selectedUser }) {
  useGetAllMessage();
  useGetRTM();
  const { user } = useSelector(store => store.auth);
  const { messages } = useSelector(store => store.chat);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (Array.isArray(messages) && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    const handleResize = () => setIsMobile(window.innerWidth < 690);
    window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
      };
  }, [messages,]);

  return (
    <div className="overflow-y-auto hide-scrollbar flex-1 p-4 mt-14 mb-14">
      <div className="flex justify-center mb-4">
        <div className="flex flex-col items-center justify-center">
          <Avatar className="w-20 h-20 text-black">
            <AvatarImage src={selectedUser?.profilePicture} alt="Profile_image" />
            <AvatarFallback>
              {selectedUser?.username?.slice(0, 2)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{selectedUser?.username}</span>
          <Link to={`/profile/${selectedUser?._id}`}>
            <Button className={`h-8 my-2 cursor-pointer ${isMobile?"bg-purple-500 hover:bg-green-900":'bg-white text-black hover:bg-gray-200'} variant="secondary"`}>
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.isArray(messages) &&
          messages.map((msg) => (
            <div key={msg?._id} className={`flex ${msg?.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`p-2 rounded-lg max-w-xs break-word ${
                  msg?.senderId === user?._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-black'
                }`}
              >
                {msg?.message}
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
