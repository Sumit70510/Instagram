import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { setSelectedUser } from '@/Redux/authslice';
import { ArrowLeft, MessageCircleCode, Search } from 'lucide-react';
import Messages from './Messages.jsx';
import { Button } from './ui/button.jsx';
import api from '@/Lib/api.js';
import { setMessages } from '@/Redux/chatSlice.js';
import { toast } from 'sonner';
import { Link } from 'react-router';

export default function ChatPage() {  
  const { user, selectedUser } = useSelector(store => store.auth);  
  const dispatch = useDispatch();
  const [selected, setSelected] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { onlineUsers, messages } = useSelector(store => store.chat);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/message/conversations/get');
        if (res.data.success) {
          setConversations(res.data.conversations || []);
        }
      } catch (error) {
        console.log(error);
        toast.error('Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredUsers = conversations
    ?.map((conv) => conv.participants[0])
    .filter((user) =>
      user && user.username.toLowerCase().includes(searchInput.toLowerCase())
    ) || [];
  
  const sendMessageHandler = async (recieverId) => {
    if (!textMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    try {
      const res = await api.post(`/message/send/${recieverId}`,
        { message: textMessage },
        {
          headers: { 'Content-Type': 'application/json' }
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 690);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      dispatch(setSelectedUser(null));
      setTextMessage("");
    };
  }, []); 

  return (
    <div className={`flex overflow-hidden h-screen ${isMobile ? "" : "ml-[16%]"}`}>
      {!isMobile && (
        <section className="w-full md:w-1/4 lg:w-1/4 sm:w-1/2 py-4 border-r border-gray-300 overflow-x-hidden hide-scrollbar">
          <h1 className="font-bold mb-3 px-3 text-xl">{user?.username}</h1>
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="mx-3 mb-3 w-[calc(100%-24px)] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-transparent"
          />
          <hr className="mb-3 border-gray-300" />
          <div className="h-[80vh] overflow-y-auto hide-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading conversations...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <Search className="w-16 h-16 text-gray-400 mb-3" />
                <h2 className="font-semibold text-gray-700 mb-2">No Conversations Yet</h2>
                <p className="text-gray-500 text-center text-sm mb-4">
                  Start a conversation by searching for users
                </p>
                <Link to="/Search">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    Search Users
                  </Button>
                </Link>
              </div>
            ) : (
              filteredUsers?.map((chatUser) => {
                const isOnline = onlineUsers?.includes(chatUser?._id);
                return (
                  <div
                    key={chatUser._id}
                    className="flex gap-3 items-center p-3 hover:bg-gray-300 cursor-pointer"
                    onClick={() => {
                      dispatch(setSelectedUser(chatUser));
                      setSelected(chatUser);
                    }}
                  >
                    <Avatar className="w-14 h-14 text-black">
                      <AvatarImage src={chatUser?.profilePicture} alt="Profile_image" />
                      <AvatarFallback>{chatUser?.username?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{chatUser?.username}</span>
                      <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'} font-bold`}>
                        {isOnline ? 'online' : 'offline'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {!isMobile ? (
  selectedUser ? (
    <section className="flex flex-col flex-1 h-full justify-between">
      <div className="flex gap-3 items-center px-3 py-2 mt-1 sticky top-0 border-b border-gray-300 bg-white">
        <Avatar className="w-14 h-14 text-black">
          <AvatarImage src={selectedUser?.profilePicture} alt="Profile_image" />
          <AvatarFallback >
            {selectedUser?.username?.slice(0, 2)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span>{selectedUser?.username}</span>
        </div>
      </div>

      <Messages selectedUser={selectedUser} />

      <div className="flex items-center py-4 border-t border-t-gray-300 px-2">
        <input
          type="text"
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          className="flex-1 ml-2 mr-2 focus-visible:ring-transparent border rounded-lg px-2 py-1"
          placeholder="Type your message here..."
        />
        <Button onClick={() => sendMessageHandler(selectedUser?._id)} className="mr-1">
          Send
        </Button>
      </div>
    </section>
  ) : (
    <div className="flex flex-col items-center justify-center mx-auto h-full w-full">
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center">
          <Search className="w-16 h-16 text-gray-400 mb-3" />
          <h1 className="font-medium text-xl">Your Messages</h1>
          <span className="text-gray-600 text-center px-4 mb-4">No conversations yet. Search for users to start chatting!</span>
          <Link to="/Search">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Search Users
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <MessageCircleCode className="w-32 h-32 my-4" />
          <h1 className="font-medium text-xl">Select a conversation</h1>
          <span>Choose someone to chat</span>
        </div>
      )}
    </div>
  )
) : (
<div className="w-screen h-full flex flex-col">
  {!selectedUser ? (
    <section className="flex flex-col h-full w-full overflow-x-hidden bg-zinc-900">
      <div className="fixed top-12 left-0 right-0 w-full bg-zinc-900 z-20 p-3 border-b border-zinc-700">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 focus:outline-none focus-visible:ring-transparent"
        />
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar pt-18">
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-zinc-400">Loading conversations...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 px-4">
          <Search className="w-16 h-16 text-zinc-500 mb-3" />
          <h2 className="font-semibold text-white mb-2">No Conversations Yet</h2>
          <p className="text-zinc-400 text-center text-sm mb-4">
            Start a conversation by searching for users
          </p>
          <Link to="/Search">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Search Users
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {filteredUsers?.map((chatUser) => {
            const isOnline = onlineUsers?.includes(chatUser?._id);
            return (
              <>
              <div
                key={chatUser._id}
                className="flex gap-3 items-center p-3 hover:bg-zinc-700 cursor-pointer w-full"
                onClick={() => {
                  dispatch(setMessages(null))
                  dispatch(setSelectedUser(chatUser))}}
              >
                <Avatar className="w-14 h-14 text-black">
                  <AvatarImage src={chatUser?.profilePicture} alt="Profile_image" />
                  <AvatarFallback>
                    {chatUser?.username?.slice(0, 2)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-white ">{chatUser?.username}</span>
                  <span
                    className={`text-xs ${
                      isOnline ? "text-green-600" : "text-red-600"
                    } font-bold`}
                  >
                    {isOnline ? "online" : "offline"}
                  </span>
                </div>
              </div>
              <hr className="w-full border-zinc-700" />
              </>
            );
          })}
        </>
      )}
      </div>
    </section>
  ) : (

    <section className="flex flex-col h-full justify-between text-white bg-zinc-900">
      <div className="flex gap-3 items-center px-3 py-2 fixed top-12 left-0 right-0 w-full border-b border-zinc-700 bg-zinc-900 z-20">
        <button
          className="text-lg font-bold mr-2"
          onClick={() => {dispatch(setSelectedUser(null))
            dispatch(setMessages(null)); 
           }
          }
        >
          <ArrowLeft/>
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

      <Messages selectedUser={selectedUser} />

      <div className="flex items-center py-3 fixed bottom-12 left-0 right-0 w-full border-t border-t-zinc-700 px-2 bg-zinc-900 z-20">
        <input
          type="text"
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          className="flex-1 ml-2 mr-2 focus-visible:ring-transparent border border-zinc-700 rounded-lg px-2 py-1 bg-zinc-800 text-white"
          placeholder="Type your message here..."
        />
        <Button onClick={() => sendMessageHandler(selectedUser?._id)} className="bg-blue-600 hover:bg-blue-700 text-white mr-1">
          Send
        </Button>
      </div>
    </section>
  )}
</div>

)}

    </div>
  );
}
