import { PlusIcon } from "lucide-react";
import StoryCard from "./StoryCard.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";

export default function StoryBar({
  groups = [],
  currentUser,
  onGroupClick,
  onCreateStory,
}) {
  const ownGroup = groups.find(
    (group) =>
      String(group.user?._id) === String(currentUser?._id)
  );

  const hasOwnGroup = !!ownGroup;

  const ownHasUnviewed = ownGroup
    ? ownGroup.stories?.some((story) => {
        const viewers = story.viewers || [];

        return !viewers.some(
          (viewerId) =>
            String(viewerId) === String(currentUser?._id)
        );
      })
    : false;

  const otherGroups = groups.filter(
    (group) =>
      String(group.user?._id) !== String(currentUser?._id)
  );

  return (
    <div
      className="
        flex
        flex-nowrap
        overflow-x-auto
        overflow-y-hidden
        gap-4
        w-full
        min-w-0
        scrollbar-none
        snap-x
        snap-mandatory
        touch-pan-x
        mb-4
        bg-transparent
        p-2
        sm:p-4
        rounded-xl
        items-center
        backdrop-blur-sm
      "
      style={{
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* YOUR STORY */}

      <div
        className="
          flex
          flex-col
          items-center
          shrink-0
          snap-start
        "
      >
        <button
          type="button"
          onClick={() =>
            hasOwnGroup
              ? onGroupClick?.(ownGroup.user._id)
              : onCreateStory?.()
          }
          className="
            relative
            flex
            h-16
            w-16
            sm:h-20
            sm:w-20
            md:h-[84px]
            md:w-[84px]
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-slate-200
            dark:border-zinc-800
            bg-white
            dark:bg-zinc-800
            shadow-sm
            transition
            hover:shadow-md
          "
        >
          <div
            className={`
              w-full
              h-full
              flex
              items-center
              justify-center
              rounded-full
              box-border
              ${
                hasOwnGroup
                  ? ownHasUnviewed
                    ? "p-[3px] bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600"
                    : "p-[3px] bg-gray-300 dark:bg-zinc-600"
                  : ""
              }
            `}
          >
            <Avatar className="h-full w-full">
              <AvatarImage
                src={currentUser?.profilePicture}
                alt="Profile Photo"
              />
              <AvatarFallback>
                {currentUser?.username
                  ?.slice(0, 2)
                  ?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              onCreateStory?.();
            }}
            className="
              absolute
              bottom-1.5
              right-1.5
              md:bottom-0
              md:right-0
              h-6
              w-6
              sm:h-7
              sm:w-7
              flex
              items-center
              justify-center
              rounded-full
              border-2
              border-white
              dark:border-zinc-900
              bg-blue-500
              text-white
              shadow-lg
            "
          >
            <PlusIcon className="h-4 w-4" />
          </div>
        </button>

        <span className="text-xs mt-1 text-slate-500 dark:text-slate-400">
          Your story
        </span>
      </div>

      {/* OTHER STORIES */}

      {otherGroups.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          No stories available yet.
        </div>
      ) : (
        otherGroups.map((group) => (
          <StoryCard
            key={group.user._id}
            group={group}
            currentUser={currentUser}
            onClick={() =>
              onGroupClick?.(group.user._id)
            }
          />
        ))
      )}
    </div>
  );
}