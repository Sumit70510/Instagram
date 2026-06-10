import Login from './Components/Login.jsx'
import Signup from './Components/Signup.jsx';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './Components/MainLayout.jsx';
import Home from './Components/Home.jsx';
import Profile from './Components/Profile.jsx';
import { RouterProvider } from 'react-router-dom';
import EditProfile from './Components/EditProfile.jsx';
import ChatPage from './Components/ChatPage.jsx';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { createContext, useEffect, useRef } from 'react';
import { setSocket } from './Redux/socketSlice.js';
import { setOnlineUsers } from './Redux/chatSlice.js';
import { setLikeNotification } from './Redux/rtnSlice.js';
import { setAuthUser } from './Redux/authslice.js';
import ProtectedRoutes from './Components/ProtectedRoutes.jsx';
import MobileComments from './Components/MobileComments.jsx';
import SearchUser from './Components/SearchUser.jsx';

const socketURL = import.meta.env.VITE_URL;


export const ScrollContext = createContext();

const browserRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'profile/:id', element: <Profile /> },
      { path: 'account/edit', element: <EditProfile /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'search', element: <SearchUser /> }
    ]
  },
  {
    path: '/:postId/comments',
    element: (
      <ProtectedRoutes>
        <MobileComments />
      </ProtectedRoutes>
    )
  },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> }
]);

function App() {
  
  const {user} = useSelector(store=>store.auth);
  const dispatch = useDispatch();
  const {socket} = useSelector(store=>store.socketio);
  
useEffect(() => {
  if (!user) {
    if (socket) {
      socket.off('getOnlineUsers');
      socket.off('notification');
      socket.close();
      dispatch(setSocket(null));
    }
    return;
  }

  const socketio = io(socketURL, {
    query: { userId: user._id },
    transports: ['websocket']
  });

  dispatch(setSocket(socketio));

  socketio.on('getOnlineUsers', (onlineUsers) => {
    dispatch(setOnlineUsers(onlineUsers));
  });

  socketio.on('notification', (notification) => {
    dispatch(setLikeNotification(notification));
  });

  return () => {
    socketio.off('getOnlineUsers');
    socketio.off('notification');
    socketio.close();
    dispatch(setSocket(null));
  };

}, [user, dispatch]);
   
  const scrollContainerRef = useRef(null);
const storiesRef = useRef(null);

const scrollToTopStories = () => {

  // Desktop
  storiesRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  // Mobile
  if (!scrollContainerRef.current || !storiesRef.current) return;

  const container = scrollContainerRef.current;

  const targetPosition =
    storiesRef.current.offsetTop - 70;

  container.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });
};

  return (
    <ScrollContext.Provider
  value={{
    scrollContainerRef,
    storiesRef,
    scrollToTopStories,
  }}
>
      <RouterProvider router={browserRouter} />
    </ScrollContext.Provider>
  );
  
}

export default App;
