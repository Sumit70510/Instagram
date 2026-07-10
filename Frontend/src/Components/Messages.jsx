import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { Button } from "./ui/button.jsx";
import useGetAllMessage from "@/Hooks/useGetAllMessage.jsx";
import useGetRTM from "@/Hooks/useGetRTM.jsx";
import useTheme from "@/Redux/theme.js";

export default function Messages({ selectedUser }) {
  useGetAllMessage();
  useGetRTM();

  const { user } = useSelector((store) => store.auth);
  const { messages = [] } = useSelector((store) => store.chat);
  const { themeMode } = useTheme();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const isDark = themeMode === "dark";

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const formatMessageTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!selectedUser) {
    return (
      <section
        className={`
          flex min-h-0 flex-1 items-center justify-center px-6 text-center
          ${isDark ? "bg-black text-white" : "bg-white text-gray-950"}
        `}
      >
        <div>
          <h2 className="text-lg font-semibold">Select a conversation</h2>

          <p
            className={`
              mt-1 text-sm
              ${isDark ? "text-zinc-400" : "text-gray-500"}
            `}
          >
            Choose a user to start viewing messages.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={messagesContainerRef}
      className={`
        hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto
        scroll-smooth px-3 pb-20 pt-16
        sm:px-5 md:px-6
        ${isDark ? "bg-black text-white" : "bg-white text-gray-950"}
      `}
    >
      {/* Conversation profile information */}
      <header className="flex flex-col items-center justify-center py-8 text-center">
        <Avatar
          className={`
            h-20 w-20 border sm:h-24 sm:w-24
            ${
              isDark
                ? "border-zinc-700 bg-zinc-900"
                : "border-gray-200 bg-gray-100"
            }
          `}
        >
          <AvatarImage
            src={selectedUser?.profilePicture}
            alt={`${selectedUser?.username || "User"} profile`}
            className="object-cover"
          />

          <AvatarFallback
            className={`
              text-xl font-semibold
              ${
                isDark
                  ? "bg-zinc-900 text-zinc-300"
                  : "bg-gray-100 text-gray-600"
              }
            `}
          >
            {selectedUser?.username?.slice(0, 2)?.toUpperCase() || "US"}
          </AvatarFallback>
        </Avatar>

        <h2 className="mt-3 max-w-[250px] truncate text-base font-semibold">
          {selectedUser?.username}
        </h2>

        {selectedUser?.fullname && (
          <p
            className={`
              mt-0.5 max-w-[280px] truncate text-sm
              ${isDark ? "text-zinc-400" : "text-gray-500"}
            `}
          >
            {selectedUser.fullname}
          </p>
        )}

        <Button
          asChild
          variant="secondary"
          className={`
            mt-4 h-8 rounded-lg border px-4 text-sm font-semibold
            ${
              isDark
                ? "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                : "border-gray-200 bg-gray-100 text-gray-950 hover:bg-gray-200"
            }
          `}
        >
          <Link to={`/profile/${selectedUser?._id}`}>
            View profile
          </Link>
        </Button>
      </header>

      {/* Messages */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5">
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((message, index) => {
            const isOwnMessage = message?.senderId === user?._id;

            const previousMessage = messages[index - 1];

            const isSameSenderAsPrevious =
              previousMessage?.senderId === message?.senderId;

            const shouldShowAvatar =
              !isOwnMessage &&
              (!messages[index + 1] ||
                messages[index + 1]?.senderId !== message?.senderId);

            return (
              <div
                key={message?._id || `${message?.senderId}-${index}`}
                className={`
                  flex w-full items-end gap-2
                  ${isOwnMessage ? "justify-end" : "justify-start"}
                  ${isSameSenderAsPrevious ? "mt-0" : "mt-2"}
                `}
              >
                {!isOwnMessage && (
                  <div className="w-7 shrink-0">
                    {shouldShowAvatar && (
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={selectedUser?.profilePicture}
                          alt={selectedUser?.username || "User"}
                          className="object-cover"
                        />

                        <AvatarFallback className="text-[10px]">
                          {selectedUser?.username
                            ?.slice(0, 2)
                            ?.toUpperCase() || "US"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div
                  className={`
                    group relative max-w-[78%] wrap-break-word px-3 py-2
                    text-sm leading-5 sm:max-w-[65%]
                    ${
                      isOwnMessage
                        ? "rounded-[20px] rounded-br-md bg-[#3797f0] text-white"
                        : isDark
                          ? "rounded-[20px] rounded-bl-md bg-zinc-800 text-white"
                          : "rounded-[20px] rounded-bl-md bg-gray-100 text-gray-950"
                    }
                  `}
                >
                  <p className="whitespace-pre-wrap wrap-break-word">
                    {message?.message}
                  </p>

                  {message?.createdAt && (
                    <span
                      className={`
                        mt-1 hidden text-[10px] leading-none group-hover:block
                        ${
                          isOwnMessage
                            ? "text-blue-100"
                            : isDark
                              ? "text-zinc-400"
                              : "text-gray-500"
                        }
                      `}
                    >
                      {formatMessageTime(message.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-[180px] items-center justify-center text-center">
            <div>
              <p className="text-base font-semibold">No messages yet</p>

              <p
                className={`
                  mt-1 text-sm
                  ${isDark ? "text-zinc-400" : "text-gray-500"}
                `}
              >
                Send a message to start the conversation.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>
    </section>
  );
}