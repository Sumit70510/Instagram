import useGetUserProfile from "@/Hooks/useGetUserProfile.jsx";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AtSign,
  Bookmark,
  Clapperboard,
  Grid3X3,
  Heart,
  MessageCircle,
  Settings,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { Button } from "./ui/button.jsx";
import { Badge } from "./ui/badge.jsx";
import { setAuthUser, setSelectedUser } from "@/Redux/authslice.js";
import { setSelectedPost } from "@/Redux/postSlice.js";
import api from "@/Lib/api.js";
import { toast } from "sonner";
import useTheme from "@/Redux/theme.js";
import CommentDialog from "./CommentDialog.jsx";

export default function Profile() {
  const { id: userId } = useParams();

  useGetUserProfile(userId);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userProfile, user } = useSelector((store) => store.auth);
  const { themeMode } = useTheme();

  const [activeTab, setActiveTab] = useState("POSTS");
  const [isFollowing, setIsFollowing] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSelectedPost, setOpenSelectedPost] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 690);

  const isDark = themeMode === "dark";
  const isLoggedInUserProfile = user?._id === userProfile?._id;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 690);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setIsFollowing(
      Boolean(user?.following?.includes(userProfile?._id))
    );
  }, [user, userProfile]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleFollowUnFollow = async () => {
    try {
      const res = await api.post(
        `/user/followorunfollow/${userProfile?._id}`
      );

      if (res.data.success) {
        const currentFollowing = user?.following || [];

        const newFollowing = isFollowing
          ? currentFollowing.filter((id) => id !== userProfile?._id)
          : [...currentFollowing, userProfile?._id];

        setIsFollowing((previousState) => !previousState);

        dispatch(
          setAuthUser({
            ...user,
            following: newFollowing,
          })
        );

        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Something went wrong"
      );
    }
  };

  const sendMessage = () => {
    dispatch(setSelectedUser(userProfile));
    navigate("/chat");
  };

  const openPostDialog = async (postId) => {
    try {
      const res = await api.get(`/post/singelPost/${postId}`);

      if (res.data.success) {
        const fullPost = res.data.post;

        dispatch(setSelectedPost(fullPost));
        setOpenSelectedPost(fullPost);
        setOpen(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load post");
    }
  };

  const displayedPosts =
    activeTab === "POSTS"
      ? userProfile?.posts
      : activeTab === "SAVED"
        ? userProfile?.bookmarks
        : [];

  const orderedPosts = displayedPosts
    ? [...displayedPosts].reverse()
    : [];

  const tabs = [
    {
      id: "POSTS",
      label: "POSTS",
      icon: Grid3X3,
    },
    {
      id: "SAVED",
      label: "SAVED",
      icon: Bookmark,
    },
    {
      id: "REELS",
      label: "REELS",
      icon: Clapperboard,
    },
    {
      id: "TAGS",
      label: "TAGGED",
      icon: UserRound,
    },
  ];

  const secondaryButtonClass = isDark
    ? "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
    : "border-gray-200 bg-gray-100 text-gray-950 hover:bg-gray-200";

  return (
    <main
      className={`
        min-h-full w-full overflow-y-auto
        ${isDark ? "bg-black text-white" : "bg-white text-gray-950"}
        md:ml-[16%] md:w-[84%]
      `}
    >
      <div className="mx-auto w-full max-w-[975px] pb-20 md:px-5 md:pb-10">
        {/* Mobile username header */}
        <header
          className={`
            sticky top-0 z-20 flex h-12 items-center justify-center
            border-b px-4 backdrop-blur-md md:hidden
            ${
              isDark
                ? "border-zinc-800 bg-black/90"
                : "border-gray-200 bg-white/90"
            }
          `}
        >
          <h1 className="max-w-[75%] truncate text-base font-semibold">
            {userProfile?.username || "Profile"}
          </h1>
        </header>

        {/* Profile information */}
        <section className="px-4 pt-5 sm:px-8 md:px-10 md:pt-10">
          <div className="md:grid md:grid-cols-[230px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
            {/* Mobile avatar and stats */}
            <div className="flex items-center justify-between md:block">
              <div className="flex flex-1 justify-start md:justify-center">
                <Avatar
                  className={`
                    h-[86px] w-[86px] border
                    sm:h-24 sm:w-24
                    md:h-[150px] md:w-[150px]
                    ${
                      isDark
                        ? "border-zinc-700 bg-zinc-900"
                        : "border-gray-200 bg-gray-100"
                    }
                  `}
                >
                  <AvatarImage
                    src={userProfile?.profilePicture}
                    alt={`${userProfile?.username || "User"} profile`}
                    className="object-cover"
                  />

                  <AvatarFallback
                    className={`
                      text-xl font-semibold md:text-3xl
                      ${
                        isDark
                          ? "bg-zinc-900 text-zinc-300"
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                  >
                    {userProfile?.username
                      ?.slice(0, 2)
                      ?.toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Mobile statistics */}
              <div className="grid flex-2 grid-cols-3 md:hidden">
                <ProfileStat
                  value={userProfile?.posts?.length || 0}
                  label="posts"
                />

                <ProfileStat
                  value={userProfile?.followers?.length || 0}
                  label="followers"
                />

                <ProfileStat
                  value={userProfile?.following?.length || 0}
                  label="following"
                />
              </div>
            </div>

            {/* Profile details */}
            <div className="mt-5 min-w-0 md:mt-0">
              {/* Desktop username and buttons */}
              <div className="hidden min-h-10 flex-wrap items-center gap-3 md:flex">
                <h1 className="max-w-[260px] truncate text-xl font-normal">
                  {userProfile?.username}
                </h1>

                {isLoggedInUserProfile ? (
                  <>
                    <Button
                      asChild
                      variant="secondary"
                      className={`
                        h-8 rounded-lg border px-4 text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      <Link to="/account/edit">Edit profile</Link>
                    </Button>

                    <Button
                      variant="secondary"
                      className={`
                        h-8 rounded-lg border px-4 text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      View archive
                    </Button>

                    <button
                      type="button"
                      aria-label="Profile settings"
                      className={`
                        rounded-full p-1.5 transition-colors
                        ${
                          isDark
                            ? "hover:bg-zinc-900"
                            : "hover:bg-gray-100"
                        }
                      `}
                    >
                      <Settings size={23} strokeWidth={2} />
                    </button>
                  </>
                ) : isFollowing ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleFollowUnFollow}
                      className={`
                        h-8 rounded-lg border px-5 text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      Following
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={sendMessage}
                      className={`
                        h-8 rounded-lg border px-5 text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      Message
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleFollowUnFollow}
                    className="h-8 rounded-lg bg-[#0095f6] px-6 text-sm font-semibold text-white hover:bg-[#1877f2]"
                  >
                    Follow
                  </Button>
                )}
              </div>

              {/* Desktop statistics */}
              <div className="mt-6 hidden items-center gap-10 md:flex">
                <DesktopProfileStat
                  value={userProfile?.posts?.length || 0}
                  label="posts"
                />

                <DesktopProfileStat
                  value={userProfile?.followers?.length || 0}
                  label="followers"
                />

                <DesktopProfileStat
                  value={userProfile?.following?.length || 0}
                  label="following"
                />
              </div>

              {/* Biography */}
              <div className="mt-4 max-w-lg text-sm">
                {userProfile?.fullname && (
                  <p className="font-semibold">
                    {userProfile.fullname}
                  </p>
                )}

                <Badge
                  variant="secondary"
                  className={`
                    mt-1.5 w-fit rounded-full border-0 px-2 py-1
                    font-medium
                    ${
                      isDark
                        ? "bg-zinc-900 text-zinc-200"
                        : "bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  <AtSign className="mr-1 h-3.5 w-3.5" />
                  {userProfile?.username}
                </Badge>

                {userProfile?.bio && (
                  <p className="mt-2 whitespace-pre-line wrap-break-word leading-[18px]">
                    {userProfile.bio}
                  </p>
                )}
              </div>

              {/* Mobile action buttons */}
              <div className="mt-4 flex gap-2 md:hidden">
                {isLoggedInUserProfile ? (
                  <>
                    <Button
                      asChild
                      variant="secondary"
                      className={`
                        h-8 flex-1 rounded-lg border text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      <Link to="/account/edit">Edit profile</Link>
                    </Button>

                    <Button
                      variant="secondary"
                      className={`
                        h-8 flex-1 rounded-lg border text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      View archive
                    </Button>
                  </>
                ) : isFollowing ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleFollowUnFollow}
                      className={`
                        h-8 flex-1 rounded-lg border text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      Following
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={sendMessage}
                      className={`
                        h-8 flex-1 rounded-lg border text-sm font-semibold
                        ${secondaryButtonClass}
                      `}
                    >
                      Message
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleFollowUnFollow}
                    className="h-8 flex-1 rounded-lg bg-[#0095f6] text-sm font-semibold text-white hover:bg-[#1877f2]"
                  >
                    Follow
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav
          className={`
            mt-6 border-t md:mt-11
            ${isDark ? "border-zinc-800" : "border-gray-200"}
          `}
        >
          <div className="grid grid-cols-4 md:flex md:justify-center md:gap-14">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  className={`
                    relative flex h-12 items-center justify-center gap-1.5
                    text-xs transition-colors md:h-[53px]
                    ${
                      isActive
                        ? isDark
                          ? "text-white"
                          : "text-gray-950"
                        : isDark
                          ? "text-zinc-500 hover:text-zinc-300"
                          : "text-gray-400 hover:text-gray-700"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute inset-x-0 top-0 h-px md:w-full
                      ${
                        isActive
                          ? isDark
                            ? "bg-white"
                            : "bg-gray-950"
                          : "bg-transparent"
                      }
                    `}
                  />

                  <Icon
                    className="h-[18px] w-[18px] md:h-3.5 md:w-3.5"
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />

                  <span className="hidden font-semibold tracking-[1px] md:inline">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Posts grid */}
        {orderedPosts.length > 0 ? (
          <section className="grid grid-cols-3 gap-0.5 md:gap-1">
            {orderedPosts.map((post) => (
              <button
                key={post?._id}
                type="button"
                aria-label="Open post"
                className={`
                  group relative block aspect-square w-full
                  overflow-hidden focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-[#0095f6]
                `}
                onClick={() => {
                  if (isMobile) {
                    dispatch(setSelectedPost(post));
                    navigate(`/${post?._id}/comments`);
                  } else {
                    openPostDialog(post?._id);
                  }
                }}
              >
                <img
                  src={post?.image}
                  alt="Profile post"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-[1.015]"
                />

                {/* Desktop hover overlay */}
                <div className="absolute inset-0 hidden items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
                  <div className="flex items-center gap-7 text-white">
                    <div className="flex items-center gap-2">
                      <Heart
                        className="h-6 w-6 fill-white"
                        strokeWidth={2.5}
                      />
                      <span className="text-base font-bold">
                        {post?.likes?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageCircle
                        className="h-6 w-6 fill-white"
                        strokeWidth={2.5}
                      />
                      <span className="text-base font-bold">
                        {post?.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <EmptyProfileTab
            activeTab={activeTab}
            isDark={isDark}
            isOwnProfile={isLoggedInUserProfile}
          />
        )}
      </div>

      <CommentDialog
        open={open}
        setOpen={setOpen}
        post={openSelectedPost}
      />
    </main>
  );
}

function ProfileStat({ value, label }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center">
      <span className="text-sm font-semibold leading-5">
        {formatCount(value)}
      </span>

      <span className="max-w-full truncate text-xs leading-4 text-gray-500">
        {label}
      </span>
    </div>
  );
}

function DesktopProfileStat({ value, label }) {
  return (
    <div className="flex items-center gap-1.5 text-base">
      <span className="font-semibold">{formatCount(value)}</span>
      <span>{label}</span>
    </div>
  );
}

function EmptyProfileTab({
  activeTab,
  isDark,
  isOwnProfile,
}) {
  const emptyContent = {
    POSTS: {
      icon: Grid3X3,
      title: isOwnProfile ? "Share photos" : "No posts yet",
      description: isOwnProfile
        ? "When you share photos, they will appear on your profile."
        : "When this user shares posts, they will appear here.",
    },
    SAVED: {
      icon: Bookmark,
      title: "Save",
      description:
        "Save posts that you want to see again. Only you can see what you have saved.",
    },
    REELS: {
      icon: Clapperboard,
      title: "No reels yet",
      description:
        "Reels shared on this profile will appear here.",
    },
    TAGS: {
      icon: UserRound,
      title: "No tagged posts",
      description:
        "Photos and videos this user is tagged in will appear here.",
    },
  };

  const content = emptyContent[activeTab] || emptyContent.POSTS;
  const Icon = content.icon;

  return (
    <section className="flex min-h-[310px] flex-col items-center justify-center px-6 text-center">
      <div
        className={`
          flex h-16 w-16 items-center justify-center rounded-full border-2
          ${isDark ? "border-white" : "border-gray-950"}
        `}
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>

      <h2 className="mt-4 text-2xl font-bold">{content.title}</h2>

      <p
        className={`
          mt-2 max-w-sm text-sm
          ${isDark ? "text-zinc-400" : "text-gray-500"}
        `}
      >
        {content.description}
      </p>
    </section>
  );
}

function formatCount(value) {
  const count = Number(value) || 0;

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(
      count >= 10_000_000 ? 0 : 1
    )}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(
      count >= 100_000 ? 0 : 1
    )}K`;
  }

  return count.toString();
}