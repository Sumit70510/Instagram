import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

import Login from "./Components/Login.jsx";
import Signup from "./Components/Signup.jsx";
import MainLayout from "./Components/MainLayout.jsx";
import Home from "./Components/Home.jsx";
import Profile from "./Components/Profile.jsx";
import EditProfile from "./Components/EditProfile.jsx";
import ChatPage from "./Components/ChatPage.jsx";
import ProtectedRoutes from "./Components/ProtectedRoutes.jsx";
import MobileComments from "./Components/MobileComments.jsx";
import SearchUser from "./Components/SearchUser.jsx";

import { setSocket } from "./Redux/socketSlice.js";
import { setOnlineUsers } from "./Redux/chatSlice.js";
import { setLikeNotification } from "./Redux/rtnSlice.js";

const socketURL = import.meta.env.VITE_URL;

export const ScrollContext = createContext(null);

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "profile/:id",
        element: <Profile />,
      },
      {
        path: "account/edit",
        element: <EditProfile />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "search",
        element: <SearchUser />,
      },
    ],
  },
  {
    path: "/:postId/comments",
    element: (
      <ProtectedRoutes>
        <MobileComments />
      </ProtectedRoutes>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);

function App() {
  const dispatch = useDispatch();

  const userId = useSelector((store) => store.auth.user?._id);

  const scrollContainerRef = useRef(null);
  const storiesRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      dispatch(setOnlineUsers([]));
      dispatch(setSocket(null));
      return undefined;
    }

    if (!socketURL) {
      console.error(
        "Socket connection failed: VITE_URL is not defined in the environment variables."
      );

      return undefined;
    }

    const socketInstance = io(socketURL, {
      query: {
        userId,
      },
      transports: ["websocket"],
      withCredentials: true,
    });

    const handleOnlineUsers = (onlineUsers) => {
      dispatch(
        setOnlineUsers(Array.isArray(onlineUsers) ? onlineUsers : [])
      );
    };

    const handleNotification = (notification) => {
      if (!notification) return;

      dispatch(setLikeNotification(notification));
    };

    const handleConnectionError = (error) => {
      console.error("Socket connection error:", error.message);
    };

    dispatch(setSocket(socketInstance));

    socketInstance.on("getOnlineUsers", handleOnlineUsers);
    socketInstance.on("notification", handleNotification);
    socketInstance.on("connect_error", handleConnectionError);

    return () => {
      socketInstance.off("getOnlineUsers", handleOnlineUsers);
      socketInstance.off("notification", handleNotification);
      socketInstance.off("connect_error", handleConnectionError);

      socketInstance.disconnect();

      dispatch(setSocket(null));
      dispatch(setOnlineUsers([]));
    };
  }, [userId, dispatch]);

  const scrollToTopStories = useCallback(() => {
    const storiesElement = storiesRef.current;

    if (!storiesElement) return;

    const scrollContainer = scrollContainerRef.current;

    /*
     * If MainLayout uses a custom scrollable container,
     * scroll that container instead of scrolling the whole page.
     */
    if (scrollContainer) {
      const containerRect =
        scrollContainer.getBoundingClientRect();

      const storiesRect =
        storiesElement.getBoundingClientRect();

      const targetPosition =
        scrollContainer.scrollTop +
        storiesRect.top -
        containerRect.top -
        70;

      scrollContainer.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: "smooth",
      });

      return;
    }

    /*
     * Fallback for layouts where the browser window
     * is the main scrolling element.
     */
    storiesElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollContextValue = useMemo(
    () => ({
      scrollContainerRef,
      storiesRef,
      scrollToTopStories,
    }),
    [scrollToTopStories]
  );

  return (
    <ScrollContext.Provider value={scrollContextValue}>
      <RouterProvider router={browserRouter} />
    </ScrollContext.Provider>
  );
}

export default App;