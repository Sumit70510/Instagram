import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircleCode,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { Button } from "./ui/button.jsx";
import Messages from "./Messages.jsx";

import { setSelectedUser } from "@/Redux/authslice";
import { setMessages } from "@/Redux/chatSlice.js";
import useTheme from "@/Redux/theme.js";
import api from "@/Lib/api.js";

const MOBILE_BREAKPOINT = 690;

export default function ChatPage() {
  const dispatch = useDispatch();

  const { user, selectedUser } = useSelector((store) => store.auth);
  const { onlineUsers, messages } = useSelector((store) => store.chat);

  const { themeMode } = useTheme();
  const isDarkMode = themeMode === "dark";

  const [textMessage, setTextMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false
  );

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);

        const res = await api.get("/message/conversations/get");

        if (res.data.success) {
          setConversations(res.data.conversations || []);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      dispatch(setSelectedUser(null));
      setTextMessage("");
    };
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    return (
      conversations
        ?.map((conversation) => conversation?.participants?.[0])
        .filter(Boolean)
        .filter((conversationUser) =>
          conversationUser?.username
            ?.toLowerCase()
            .includes(normalizedSearch)
        ) || []
    );
  }, [conversations, searchInput]);

  const sendMessageHandler = async (receiverId) => {
    const trimmedMessage = textMessage.trim();

    if (!trimmedMessage) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!receiverId || isSending) return;

    try {
      setIsSending(true);

      const res = await api.post(
        `/message/send/${receiverId}`,
        { message: trimmedMessage },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        const currentMessages = Array.isArray(messages) ? messages : [];

        dispatch(
          setMessages([...currentMessages, res.data.newMessage])
        );

        setTextMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      toast.error(
        error.response?.data?.message || "Failed to send message"
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessageHandler(selectedUser?._id);
    }
  };

  const handleSelectConversation = (chatUser, clearMessages = false) => {
    if (clearMessages) {
      dispatch(setMessages(null));
    }

    dispatch(setSelectedUser(chatUser));
  };

  const handleMobileBack = () => {
    dispatch(setSelectedUser(null));
    dispatch(setMessages(null));
    setTextMessage("");
  };

  const pageTheme = isDarkMode
    ? "bg-black text-slate-100"
    : "bg-white text-slate-950";

  const panelTheme = isDarkMode
    ? "border-zinc-800 bg-black"
    : "border-slate-200 bg-white";

  const inputTheme = isDarkMode
    ? "border-zinc-700 bg-zinc-900 text-slate-100 placeholder:text-zinc-500 focus:border-zinc-500"
    : "border-slate-300 bg-slate-50 text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white";

  return (
    <main
      className={`
        flex h-[100dvh] min-h-0 w-full overflow-hidden
        ${isMobile ? "" : "md:ml-[16%] md:w-[84%]"}
        ${pageTheme}
      `}
    >
      {!isMobile && (
        <ConversationSidebar
          currentUser={user}
          users={filteredUsers}
          onlineUsers={onlineUsers}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          selectedUser={selectedUser}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          panelTheme={panelTheme}
          inputTheme={inputTheme}
          onSelectUser={(chatUser) =>
            handleSelectConversation(chatUser, false)
          }
        />
      )}

      {!isMobile ? (
        selectedUser ? (
          <DesktopChatPanel
            selectedUser={selectedUser}
            textMessage={textMessage}
            setTextMessage={setTextMessage}
            isSending={isSending}
            isDarkMode={isDarkMode}
            panelTheme={panelTheme}
            inputTheme={inputTheme}
            onSend={() => sendMessageHandler(selectedUser?._id)}
            onMessageKeyDown={handleMessageKeyDown}
          />
        ) : (
          <DesktopEmptyState
            hasConversations={filteredUsers.length > 0}
            isDarkMode={isDarkMode}
          />
        )
      ) : (
        <MobileChatLayout
          selectedUser={selectedUser}
          users={filteredUsers}
          onlineUsers={onlineUsers}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          textMessage={textMessage}
          setTextMessage={setTextMessage}
          isLoading={isLoading}
          isSending={isSending}
          isDarkMode={isDarkMode}
          panelTheme={panelTheme}
          inputTheme={inputTheme}
          onSelectUser={(chatUser) =>
            handleSelectConversation(chatUser, true)
          }
          onBack={handleMobileBack}
          onSend={() => sendMessageHandler(selectedUser?._id)}
          onMessageKeyDown={handleMessageKeyDown}
        />
      )}
    </main>
  );
}

function ConversationSidebar({
  currentUser,
  users,
  onlineUsers,
  searchInput,
  setSearchInput,
  selectedUser,
  isLoading,
  isDarkMode,
  panelTheme,
  inputTheme,
  onSelectUser,
}) {
  return (
    <aside
      className={`
        flex h-full w-[320px] min-w-[280px] max-w-[360px]
        flex-col border-r xl:w-[360px]
        ${panelTheme}
      `}
    >
      <div
        className={`
          shrink-0 border-b px-4 pb-4 pt-5
          ${isDarkMode ? "border-zinc-800" : "border-slate-200"}
        `}
      >
        <div className="mb-4">
          <p
            className={`
              text-xs font-medium uppercase tracking-[0.16em]
              ${isDarkMode ? "text-zinc-500" : "text-slate-400"}
            `}
          >
            Messages
          </p>

          <h1 className="mt-1 truncate text-xl font-bold">
            {currentUser?.username || "Your conversations"}
          </h1>
        </div>

        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search conversations"
          inputTheme={inputTheme}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ConversationList
          users={users}
          onlineUsers={onlineUsers}
          selectedUser={selectedUser}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          onSelectUser={onSelectUser}
        />
      </div>
    </aside>
  );
}

function DesktopChatPanel({
  selectedUser,
  textMessage,
  setTextMessage,
  isSending,
  isDarkMode,
  panelTheme,
  inputTheme,
  onSend,
  onMessageKeyDown,
}) {
  return (
    <section
      className={`flex min-w-0 flex-1 flex-col ${panelTheme}`}
    >
      <ChatHeader
        selectedUser={selectedUser}
        isDarkMode={isDarkMode}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <Messages selectedUser={selectedUser} />
      </div>

      <MessageComposer
        textMessage={textMessage}
        setTextMessage={setTextMessage}
        isSending={isSending}
        isDarkMode={isDarkMode}
        inputTheme={inputTheme}
        onSend={onSend}
        onMessageKeyDown={onMessageKeyDown}
      />
    </section>
  );
}

function MobileChatLayout({
  selectedUser,
  users,
  onlineUsers,
  searchInput,
  setSearchInput,
  textMessage,
  setTextMessage,
  isLoading,
  isSending,
  isDarkMode,
  panelTheme,
  inputTheme,
  onSelectUser,
  onBack,
  onSend,
  onMessageKeyDown,
}) {
  if (!selectedUser) {
    return (
      <section
        className={`flex h-full min-h-0 w-full flex-col ${panelTheme}`}
      >
        <div
          className={`
            shrink-0 border-b px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]
            ${isDarkMode ? "border-zinc-800" : "border-slate-200"}
          `}
        >
          <div className="mb-4">
            <h1 className="text-xl font-bold">Messages</h1>

            <p
              className={`
                mt-0.5 text-sm
                ${isDarkMode ? "text-zinc-400" : "text-slate-500"}
              `}
            >
              Select a conversation to start chatting
            </p>
          </div>

          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search conversations"
            inputTheme={inputTheme}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ConversationList
            users={users}
            onlineUsers={onlineUsers}
            selectedUser={selectedUser}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            onSelectUser={onSelectUser}
            mobile
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className={`flex h-full min-h-0 w-full flex-col ${panelTheme}`}
    >
      <ChatHeader
        selectedUser={selectedUser}
        isDarkMode={isDarkMode}
        mobile
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <Messages selectedUser={selectedUser} />
      </div>

      <MessageComposer
        textMessage={textMessage}
        setTextMessage={setTextMessage}
        isSending={isSending}
        isDarkMode={isDarkMode}
        inputTheme={inputTheme}
        onSend={onSend}
        onMessageKeyDown={onMessageKeyDown}
        mobile
      />
    </section>
  );
}

function ConversationList({
  users,
  onlineUsers,
  selectedUser,
  isLoading,
  isDarkMode,
  onSelectUser,
  mobile = false,
}) {
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center px-4">
        <div
          className={`
            flex items-center gap-2 text-sm
            ${isDarkMode ? "text-zinc-400" : "text-slate-500"}
          `}
        >
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading conversations...
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return <NoConversationsState isDarkMode={isDarkMode} />;
  }

  return (
    <div className={mobile ? "py-2" : "py-2"}>
      {users.map((chatUser) => {
        const isOnline = onlineUsers?.includes(chatUser?._id);
        const isSelected = selectedUser?._id === chatUser?._id;

        return (
          <Fragment key={chatUser._id}>
            <button
              type="button"
              onClick={() => onSelectUser(chatUser)}
              className={`
                group flex w-full items-center gap-3 px-4 py-3
                text-left transition-colors duration-150
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-inset focus-visible:ring-blue-500
                ${
                  isSelected
                    ? isDarkMode
                      ? "bg-zinc-800"
                      : "bg-slate-100"
                    : isDarkMode
                      ? "hover:bg-zinc-900"
                      : "hover:bg-slate-50"
                }
              `}
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border border-black/5 sm:h-14 sm:w-14">
                  <AvatarImage
                    src={chatUser?.profilePicture}
                    alt={`${chatUser?.username || "User"} profile`}
                  />

                  <AvatarFallback
                    className={
                      isDarkMode
                        ? "bg-zinc-800 text-zinc-200"
                        : "bg-slate-200 text-slate-700"
                    }
                  >
                    {chatUser?.username
                      ?.slice(0, 2)
                      ?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <span
                  aria-label={isOnline ? "Online" : "Offline"}
                  className={`
                    absolute bottom-0 right-0 h-3.5 w-3.5
                    rounded-full border-2
                    ${isDarkMode ? "border-black" : "border-white"}
                    ${isOnline ? "bg-emerald-500" : "bg-slate-400"}
                  `}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {chatUser?.username}
                </p>

                <p
                  className={`
                    mt-0.5 text-xs font-medium
                    ${
                      isOnline
                        ? "text-emerald-500"
                        : isDarkMode
                          ? "text-zinc-500"
                          : "text-slate-400"
                    }
                  `}
                >
                  {isOnline ? "Active now" : "Offline"}
                </p>
              </div>
            </button>

            {mobile && (
              <div
                className={`
                  ml-[76px] border-b
                  ${isDarkMode ? "border-zinc-900" : "border-slate-100"}
                `}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function ChatHeader({
  selectedUser,
  isDarkMode,
  mobile = false,
  onBack,
}) {
  return (
    <header
      className={`
        z-20 flex shrink-0 items-center gap-3 border-b px-4
        ${mobile ? "min-h-[68px] pt-[env(safe-area-inset-top)]" : "h-[72px]"}
        ${
          isDarkMode
            ? "border-zinc-800 bg-black"
            : "border-slate-200 bg-white"
        }
      `}
    >
      {mobile && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className={`
            -ml-2 flex h-10 w-10 shrink-0 items-center
            justify-center rounded-full transition-colors
            focus:outline-none focus-visible:ring-2
            focus-visible:ring-blue-500
            ${
              isDarkMode
                ? "hover:bg-zinc-800"
                : "hover:bg-slate-100"
            }
          `}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <Avatar className={mobile ? "h-11 w-11" : "h-12 w-12"}>
        <AvatarImage
          src={selectedUser?.profilePicture}
          alt={`${selectedUser?.username || "User"} profile`}
        />

        <AvatarFallback
          className={
            isDarkMode
              ? "bg-zinc-800 text-zinc-200"
              : "bg-slate-200 text-slate-700"
          }
        >
          {selectedUser?.username?.slice(0, 2)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate font-semibold">
          {selectedUser?.username}
        </p>

        <p
          className={`
            text-xs
            ${isDarkMode ? "text-zinc-500" : "text-slate-400"}
          `}
        >
          Conversation
        </p>
      </div>
    </header>
  );
}

function MessageComposer({
  textMessage,
  setTextMessage,
  isSending,
  isDarkMode,
  inputTheme,
  onSend,
  onMessageKeyDown,
  mobile = false,
}) {
  const messageIsEmpty = !textMessage.trim();

  return (
    <div
      className={`
        shrink-0 border-t px-3 py-3
        ${mobile ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "sm:px-4"}
        ${
          isDarkMode
            ? "border-zinc-800 bg-black"
            : "border-slate-200 bg-white"
        }
      `}
    >
      <div
        className={`
          flex items-end gap-2 rounded-2xl border p-1.5
          ${isDarkMode ? "border-zinc-700 bg-zinc-900" : "border-slate-300 bg-slate-50"}
        `}
      >
        <textarea
          rows={1}
          value={textMessage}
          onChange={(event) => setTextMessage(event.target.value)}
          onKeyDown={onMessageKeyDown}
          placeholder="Message..."
          aria-label="Message"
          className={`
            max-h-32 min-h-[42px] flex-1 resize-none
            bg-transparent px-3 py-2.5 text-sm
            outline-none sm:text-base
            ${inputTheme}
            border-0 focus:border-0
          `}
        />

        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={messageIsEmpty || isSending}
          aria-label="Send message"
          className="
            h-10 w-10 shrink-0 rounded-xl
            bg-blue-600 text-white
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:bg-blue-600/50
          "
        >
          {isSending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  inputTheme,
}) {
  return (
    <div className="relative">
      <Search
        className="
          pointer-events-none absolute left-3 top-1/2
          h-4 w-4 -translate-y-1/2 text-slate-400
        "
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`
          h-11 w-full rounded-xl border py-2
          pl-10 pr-4 text-sm outline-none
          transition-colors focus:ring-2
          focus:ring-blue-500/20
          ${inputTheme}
        `}
      />
    </div>
  );
}

function NoConversationsState({ isDarkMode }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div
        className={`
          mb-4 flex h-16 w-16 items-center
          justify-center rounded-full
          ${isDarkMode ? "bg-zinc-900" : "bg-slate-100"}
        `}
      >
        <Search
          className={`
            h-7 w-7
            ${isDarkMode ? "text-zinc-400" : "text-slate-500"}
          `}
        />
      </div>

      <h2 className="text-lg font-semibold">
        No conversations found
      </h2>

      <p
        className={`
          mt-2 max-w-[260px] text-sm leading-6
          ${isDarkMode ? "text-zinc-400" : "text-slate-500"}
        `}
      >
        Search for another user and start a new conversation.
      </p>

      <Button
        asChild
        className="mt-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
      >
        <Link to="/search">Search users</Link>
      </Button>
    </div>
  );
}

function DesktopEmptyState({ hasConversations, isDarkMode }) {
  return (
    <section className="flex min-w-0 flex-1 items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div
          className={`
            mb-5 flex h-24 w-24 items-center
            justify-center rounded-full
            ${isDarkMode ? "bg-zinc-900" : "bg-slate-100"}
          `}
        >
          {hasConversations ? (
            <MessageCircleCode
              className={`
                h-11 w-11
                ${isDarkMode ? "text-zinc-300" : "text-slate-600"}
              `}
            />
          ) : (
            <Search
              className={`
                h-10 w-10
                ${isDarkMode ? "text-zinc-400" : "text-slate-500"}
              `}
            />
          )}
        </div>

        <h1 className="text-xl font-semibold">
          {hasConversations
            ? "Select a conversation"
            : "Your messages"}
        </h1>

        <p
          className={`
            mt-2 text-sm leading-6
            ${isDarkMode ? "text-zinc-400" : "text-slate-500"}
          `}
        >
          {hasConversations
            ? "Choose someone from the conversation list to start chatting."
            : "You do not have any conversations yet. Search for a user to begin."}
        </p>

        {!hasConversations && (
          <Button
            asChild
            className="mt-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            <Link to="/search">Search users</Link>
          </Button>
        )}
      </div>
    </section>
  );
}