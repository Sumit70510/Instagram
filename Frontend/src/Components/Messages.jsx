import React, { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx'
import { Link } from 'react-router'
import { Button } from './ui/button.jsx'
import { useSelector } from 'react-redux'
import useGetAllMessage from '@/Hooks/useGetAllMessage.jsx'
import useGetRTM from '@/Hooks/useGetRTM.jsx'
import useTheme from '@/Redux/theme.js'

export default function Messages({ selectedUser }) {
  useGetAllMessage();
  useGetRTM();
  const { user } = useSelector(store => store.auth);
  const { messages } = useSelector(store => store.chat);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  const { themeMode } = useTheme();
  
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
    <div className={`overflow-y-auto hide-scrollbar flex-1 p-4 mt-14 mb-14 ${themeMode === 'dark' ? 'bg-black text-slate-100' : 'bg-white text-slate-950'}`}>
      <div className="flex justify-center mb-4">
        <div className="flex flex-col items-center justify-center">
          <Avatar className={`w-20 h-20 ${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>
            <AvatarImage src={selectedUser?.profilePicture} alt="Profile_image" />
            <AvatarFallback>
              {selectedUser?.username?.slice(0, 2)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={`${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>{selectedUser?.username}</span>
          <Link to={`/profile/${selectedUser?._id}`}>
            <Button className={`h-8 my-2 cursor-pointer ${themeMode === 'dark' ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800' : 'bg-white text-slate-950 hover:bg-gray-200'}`} variant="secondary">
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
                    : themeMode === 'dark'
                    ? 'bg-zinc-800 text-slate-100'
                    : 'bg-gray-200 text-slate-950'
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
