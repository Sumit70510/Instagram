import React from "react";
import { Dialog, DialogContent } from "./ui/dialog.jsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar.jsx";

import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";

export default function StoryViewer({
  group,
  groupIndex,
  storyIndex,
  totalGroups,
  storyProgress,
  isPaused,
  onClose,
  onTogglePlay,
  onPrevGroup,
  onNextGroup,
  onPrevStory,
  onNextStory,
}) {
  if (!group) return null;

  const story = group.stories?.[storyIndex];

  if (!story) return null;

  const isFirstGroup = groupIndex === 0;
  const isLastGroup =
    groupIndex === totalGroups - 1;

  return (
    <Dialog
      open={Boolean(group)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="
          max-w-[95vw]
          p-0
          bg-black
          text-white
          md:bg-white
          md:text-black
          overflow-hidden
        "
      >
        {/* HEADER */}

        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* DESKTOP GROUP NAVIGATION */}

            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevGroup}
                disabled={isFirstGroup}
                className={`
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-slate-100
                  text-slate-800
                  hover:bg-slate-200
                  ${
                    isFirstGroup
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                `}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onNextGroup}
                disabled={isLastGroup}
                className={`
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-slate-100
                  text-slate-800
                  hover:bg-slate-200
                  ${
                    isLastGroup
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                `}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            {/* USER INFO */}

            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage
                  src={group.user.profilePicture}
                  alt={group.user.username}
                />

                <AvatarFallback>
                  {group.user.username
                    ?.slice(0, 2)
                    .toUpperCase() || "CN"}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="font-semibold">
                  {group.user.username}
                </p>

                <p className="text-xs text-slate-400 md:text-slate-500">
                  {new Date(
                    story.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {/* CONTROLS */}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTogglePlay}
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-white/10
                  text-white
                  hover:bg-white/20
                  md:border-slate-200
                  md:bg-slate-100
                  md:text-slate-800
                  md:hover:bg-slate-200
                "
              >
                {isPaused ? (
                  <PlayIcon className="h-4 w-4" />
                ) : (
                  <PauseIcon className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-full
                  p-2
                  hover:bg-white/10
                  md:hover:bg-slate-100
                  md:text-slate-900
                "
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* PROGRESS BAR */}

          <div className="mt-4 flex h-1 gap-1">
            {group.stories.map(
              (item, index) => (
                <div
                  key={item._id}
                  className="
                    relative
                    flex-1
                    overflow-hidden
                    rounded-full
                    bg-white/20
                    md:bg-slate-200/50
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-white
                      md:bg-slate-900
                      transition-all
                      duration-100
                      ease-linear
                    "
                    style={{
                      width:
                        index < storyIndex
                          ? "100%"
                          : index === storyIndex
                          ? `${storyProgress}%`
                          : "0%",
                    }}
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* STORY IMAGE */}

        <div
          className="
            relative
            h-[70vh]
            w-full
            overflow-hidden
            bg-black
            md:bg-white
          "
        >
          {/* MOBILE TAP ZONES */}

          <div
            className="
              absolute
              left-0
              top-0
              z-40
              h-full
              w-1/2
              md:hidden
            "
            onClick={onPrevStory}
          />

          <div
            className="
              absolute
              right-0
              top-0
              z-40
              h-full
              w-1/2
              md:hidden
            "
            onClick={onNextStory}
          />

          <img
            src={story.image}
            alt="Story"
            className="
              h-full
              w-full
              object-contain
            "
          />

          {/* DESKTOP STORY NAVIGATION */}
          <button
            type="button"
            onClick={onPrevStory}
            className="
              hidden
              md:flex
              absolute
              left-6
              top-1/2
              z-50
              -translate-y-1/2
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-white/80
              text-slate-800
              shadow-md
              hover:bg-white
            "
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onNextStory}
            className="
              hidden
              md:flex
              absolute
              right-6
              top-1/2
              z-50
              -translate-y-1/2
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-white/80
              text-slate-800
              shadow-md
              hover:bg-white
            "
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>

        {/* FOOTER */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-t
            border-white/10
            px-4
            py-3
            text-sm
            text-slate-300
            md:border-slate-200/80
            md:text-slate-700
            md:bg-white
          "
        >
          <span>
            {story.viewers?.length || 0} viewers
          </span>

          <span>
            Expires in{" "}
            {story.expiresAt
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(
                      story.expiresAt
                    ) -
                      new Date()) /
                      3600000
                  )
                )
              : 24}
            h
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}