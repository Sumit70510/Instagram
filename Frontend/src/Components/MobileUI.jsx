import {
  Heart,
  Home,
  Info,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PlusSquare,
  Search,
  Sun,
} from "lucide-react";

import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar.jsx";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover.jsx";

import CreatePost from "./CreatePost.jsx";
import api from "@/Lib/api.js";
import {
  setPosts,
  setSelectedPost,
} from "@/Redux/postSlice.js";
import { setAuthUser } from "@/Redux/authslice.js";
import useTheme from "@/Redux/theme.js";
import { ScrollContext } from "../App.jsx";

export default function MobileUI() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { themeMode, toggleTheme } = useTheme();

  const scrollContext = useContext(ScrollContext);
  const scrollToTopStories =
    scrollContext?.scrollToTopStories;

  const user = useSelector(
    (state) => state.auth?.user
  );

  const likeNotification = useSelector(
    (state) =>
      state.realTimeNotification?.likeNotification || []
  );

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const isDark = themeMode === "dark";
  const isHomePage = location.pathname === "/";

  const logoutHandler = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const res = await api.post("/user/logout");

      if (res.data.success) {
        dispatch(setSelectedPost(null));
        dispatch(setPosts([]));
        dispatch(setAuthUser(null));

        toast.success(res.data.message);

        navigate("/login", {
          replace: true,
        });
      } else {
        toast.error(
          res.data.message || "Logout failed"
        );
      }
    } catch (error) {
      console.error("Logout failed:", error);

      toast.error(
        error?.response?.data?.message ||
          "Logout failed"
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const scrollHomeToTop = useCallback(() => {
    /*
     * Wait for the Home page to render before scrolling.
     * Two animation frames are more reliable than a fixed
     * setTimeout when React Router changes the route.
     */
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (
          typeof scrollToTopStories === "function"
        ) {
          scrollToTopStories();
          return;
        }

        /*
         * Fallback when ScrollContext is unavailable.
         */
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });

        document.documentElement.scrollTo?.({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      });
    });
  }, [scrollToTopStories]);

  /*
   * Scroll after React Router finishes navigating
   * from another page to the Home page.
   */
  useEffect(() => {
    const shouldScrollHome =
      isHomePage &&
      location.state?.scrollToHomeTop === true;

    if (!shouldScrollHome) return;

    scrollHomeToTop();

    /*
     * Remove temporary route state so browser refresh
     * and back navigation do not trigger another scroll.
     */
    navigate("/", {
      replace: true,
      state: null,
    });
  }, [
    isHomePage,
    location.state,
    navigate,
    scrollHomeToTop,
  ]);

  const handleHomeClick = () => {
    /*
     * When already on Home, do not navigate again.
     * Just scroll the current Home feed to the top.
     */
    if (isHomePage) {
      scrollHomeToTop();
      return;
    }

    /*
     * Pass temporary state so scrolling happens only
     * after the Home route has rendered.
     */
    navigate("/", {
      state: {
        scrollToHomeTop: true,
      },
    });
  };

  const navItemClass = ({ isActive }) => {
    return `
      relative flex h-12 w-12
      cursor-pointer touch-manipulation
      items-center justify-center
      bg-transparent
      transition-transform duration-150
      active:scale-90
      focus:outline-none
      focus-visible:outline-none
      [-webkit-tap-highlight-color:transparent]
      ${
        isActive
          ? isDark
            ? "text-white"
            : "text-black"
          : isDark
            ? "text-zinc-300"
            : "text-gray-900"
      }
    `;
  };

  const actionButtonClass = `
    relative flex h-10 w-10
    cursor-pointer touch-manipulation
    items-center justify-center
    rounded-lg bg-transparent
    transition-transform duration-150
    active:scale-90
    focus:outline-none
    focus-visible:outline-none
    [-webkit-tap-highlight-color:transparent]
    ${
      isDark
        ? "text-white hover:bg-zinc-900"
        : "text-gray-950 hover:bg-gray-100"
    }
  `;

  return (
    <>
      {/* Mobile top navigation */}
      <header
        className={`
          fixed inset-x-0 top-0 z-50
          flex h-12 items-center justify-between
          border-b px-3 backdrop-blur-xl
          ${
            isDark
              ? `
                border-zinc-800
                bg-black/95
                text-white
              `
              : `
                border-gray-200
                bg-white/95
                text-gray-950
              `
          }
        `}
      >
        {/* Logo/Home button */}
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={handleHomeClick}
            aria-label="Go to home"
            className="
              flex min-w-0 cursor-pointer
              touch-manipulation items-center
              bg-transparent p-0
              transition-transform duration-150
              active:scale-[0.98]
              focus:outline-none
              focus-visible:outline-none
              [-webkit-tap-highlight-color:transparent]
            "
          >
            <img
              src={
                isDark
                  ? "/white.png"
                  : "/Black.png"
              }
              alt="Instagram"
              draggable="false"
              className="
                pointer-events-none
                h-8 w-auto max-w-[120px]
                select-none object-contain
              "
            />
          </button>
        </div>

        {/* Header actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Create */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create post"
            className={actionButtonClass}
          >
            <PlusSquare
              className="pointer-events-none h-6 w-6"
              strokeWidth={2}
            />
          </button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                className={actionButtonClass}
              >
                <Heart
                  className="pointer-events-none h-6 w-6"
                  strokeWidth={2}
                  fill="none"
                />

                {likeNotification.length > 0 && (
                  <span
                    className="
                      pointer-events-none
                      absolute right-0.5 top-0.5
                      flex h-[17px] min-w-[17px]
                      items-center justify-center
                      rounded-full bg-red-500 px-1
                      text-[10px] font-bold
                      leading-none text-white
                    "
                  >
                    {likeNotification.length > 9
                      ? "9+"
                      : likeNotification.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={8}
              className={`
                mr-2
                w-[min(320px,calc(100vw-16px))]
                rounded-xl border p-0 shadow-xl
                ${
                  isDark
                    ? `
                      border-zinc-800
                      bg-zinc-950
                      text-white
                    `
                    : `
                      border-gray-200
                      bg-white
                      text-gray-950
                    `
                }
              `}
            >
              <div
                className={`
                  border-b px-4 py-3
                  ${
                    isDark
                      ? "border-zinc-800"
                      : "border-gray-200"
                  }
                `}
              >
                <h2 className="font-semibold">
                  Notifications
                </h2>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {likeNotification.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <Heart
                      className={`
                        mx-auto h-8 w-8
                        ${
                          isDark
                            ? "text-zinc-600"
                            : "text-gray-300"
                        }
                      `}
                      strokeWidth={1.5}
                      fill="none"
                    />

                    <p className="mt-3 text-sm font-medium">
                      No new notifications
                    </p>

                    <p
                      className={`
                        mt-1 text-xs
                        ${
                          isDark
                            ? "text-zinc-400"
                            : "text-gray-500"
                        }
                      `}
                    >
                      New activity will appear here.
                    </p>
                  </div>
                ) : (
                  likeNotification.map(
                    (notification, index) => {
                      const notificationUserId =
                        notification?.userId ||
                        notification?.userDetails?._id;

                      const notificationUsername =
                        notification?.userDetails
                          ?.username || "Someone";

                      const notificationImage =
                        notification?.userDetails
                          ?.profilePicture;

                      return (
                        <button
                          key={
                            notification?._id ||
                            `${notificationUserId}-${index}`
                          }
                          type="button"
                          disabled={!notificationUserId}
                          onClick={() => {
                            if (
                              !notificationUserId
                            ) {
                              return;
                            }

                            navigate(
                              `/profile/${notificationUserId}`
                            );
                          }}
                          className={`
                            flex w-full items-center
                            gap-3 rounded-lg
                            px-2 py-2.5
                            text-left
                            transition-colors
                            disabled:cursor-default
                            ${
                              isDark
                                ? "hover:bg-zinc-900"
                                : "hover:bg-gray-100"
                            }
                          `}
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage
                              src={notificationImage}
                              alt={notificationUsername}
                              className="object-cover"
                            />

                            <AvatarFallback className="text-xs">
                              {notificationUsername
                                ?.slice(0, 2)
                                ?.toUpperCase() ||
                                "US"}
                            </AvatarFallback>
                          </Avatar>

                          <p className="min-w-0 text-sm">
                            <span className="font-semibold">
                              {notificationUsername}
                            </span>{" "}
                            liked your post
                          </p>
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                className={actionButtonClass}
              >
                <Menu
                  className="pointer-events-none h-6 w-6"
                  strokeWidth={2}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={8}
              className={`
                mr-2 w-52
                rounded-xl border p-1.5
                shadow-xl
                ${
                  isDark
                    ? `
                      border-zinc-800
                      bg-zinc-950
                      text-white
                    `
                    : `
                      border-gray-200
                      bg-white
                      text-gray-950
                    `
                }
              `}
            >
              <button
                type="button"
                onClick={toggleTheme}
                className={`
                  flex w-full cursor-pointer
                  items-center gap-3
                  rounded-lg px-3 py-2.5
                  text-sm transition-colors
                  ${
                    isDark
                      ? "hover:bg-zinc-900"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}

                <span>
                  {isDark
                    ? "Light mode"
                    : "Dark mode"}
                </span>
              </button>

              <a
                href="https://github.com/Sumit70510"
                target="_blank"
                rel="noreferrer"
                className={`
                  flex w-full items-center gap-3
                  rounded-lg px-3 py-2.5
                  text-sm transition-colors
                  ${
                    isDark
                      ? "hover:bg-zinc-900"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                <Info className="h-5 w-5" />

                <span>About developer</span>
              </a>

              <button
                type="button"
                onClick={logoutHandler}
                disabled={isLoggingOut}
                className={`
                  flex w-full items-center gap-3
                  rounded-lg px-3 py-2.5
                  text-sm text-red-500
                  transition-colors
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  ${
                    isDark
                      ? "hover:bg-zinc-900"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                <LogOut className="h-5 w-5" />

                <span>
                  {isLoggingOut
                    ? "Logging out..."
                    : "Log out"}
                </span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <footer
        className={`
          fixed inset-x-0 bottom-0 z-50
          border-t
          pb-[env(safe-area-inset-bottom)]
          ${
            isDark
              ? `
                border-zinc-800
                bg-black
                text-white
              `
              : `
                border-gray-200
                bg-white
                text-gray-950
              `
          }
        `}
      >
        <nav
          className="
            mx-auto flex h-14 max-w-md
            items-center justify-around px-2
          "
          aria-label="Mobile navigation"
        >
          {/* Home */}
          <button
            type="button"
            onClick={handleHomeClick}
            aria-label="Home"
            aria-current={
              isHomePage ? "page" : undefined
            }
            className={`
              relative flex h-12 w-12
              cursor-pointer touch-manipulation
              items-center justify-center
              bg-transparent
              transition-transform duration-150
              active:scale-90
              focus:outline-none
              focus-visible:outline-none
              [-webkit-tap-highlight-color:transparent]
              ${
                isHomePage
                  ? isDark
                    ? "text-white"
                    : "text-black"
                  : isDark
                    ? "text-zinc-300"
                    : "text-gray-900"
              }
            `}
          >
            <Home
              className="pointer-events-none h-6 w-6"
              strokeWidth={isHomePage ? 2.8 : 2}
              fill="none"
            />
          </button>

          {/* Search */}
          <NavLink
            to="/search"
            className={navItemClass}
            aria-label="Search"
          >
            {({ isActive }) => (
              <Search
                className="pointer-events-none h-6 w-6"
                strokeWidth={isActive ? 2.8 : 2}
              />
            )}
          </NavLink>

          {/* Create */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create post"
            className={`
              relative flex h-12 w-12
              cursor-pointer touch-manipulation
              items-center justify-center
              bg-transparent
              transition-transform duration-150
              active:scale-90
              focus:outline-none
              focus-visible:outline-none
              [-webkit-tap-highlight-color:transparent]
              ${
                isDark
                  ? "text-zinc-300"
                  : "text-gray-900"
              }
            `}
          >
            <PlusSquare
              className="pointer-events-none h-6 w-6"
              strokeWidth={2}
            />
          </button>

          {/* Messages */}
          <NavLink
            to="/chat"
            className={navItemClass}
            aria-label="Messages"
          >
            {({ isActive }) => (
              <MessageCircle
                className="pointer-events-none h-6 w-6"
                strokeWidth={isActive ? 2.8 : 2}
                fill="none"
              />
            )}
          </NavLink>

          {/* Profile */}
          <NavLink
            to={
              user?._id
                ? `/profile/${user._id}`
                : "/login"
            }
            className={navItemClass}
            aria-label="Profile"
          >
            {({ isActive }) => (
              <Avatar
                className={`
                  pointer-events-none h-7 w-7
                  ${
                    isActive
                      ? `
                        ring-2 ring-current
                        ring-offset-1
                        ${
                          isDark
                            ? "ring-offset-black"
                            : "ring-offset-white"
                        }
                      `
                      : ""
                  }
                `}
              >
                <AvatarImage
                  src={user?.profilePicture}
                  alt={
                    user?.username || "Profile"
                  }
                  className="object-cover"
                />

                <AvatarFallback className="text-[10px]">
                  {user?.username
                    ?.slice(0, 2)
                    ?.toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
            )}
          </NavLink>
        </nav>
      </footer>

      <CreatePost
        open={isCreateOpen}
        setOpen={setIsCreateOpen}
      />
    </>
  );
}