import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function StoryCard({
  group,
  currentUser,
  onClick,
}) {
  const hasUnviewed = group.stories?.some((story) => {
    const viewers = story?.viewers || [];

    return !viewers.some(
      (viewerId) =>
        String(viewerId) === String(currentUser?._id)
    );
  });

  const ringClass = hasUnviewed
    ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]"
    : "bg-gray-300 dark:bg-zinc-600 p-[3px]";

  return (
      <button
          type="button"
          onClick={onClick}
          className="
            flex
            flex-col
            items-center
            cursor-pointer
            rounded-3xl
            transition-all
            duration-200
            hover:scale-[1.03]
            focus:outline-none
            box-border
            self-center
            shrink-0
            snap-start
          "
        >
      <div
        className="
          flex
          items-center
          justify-center
          h-16
          w-16
          sm:h-20
          sm:w-20
          md:h-[84px]
          md:w-[84px]
          shrink-0
        "
      >
        <div
          className={`
            ${ringClass}
            rounded-full
            box-border
            w-full
            h-full
            flex
            items-center
            justify-center
          `}
        >
           <Avatar className={`${"h-full w-full"}`}>
              <AvatarImage src={group.user?.profilePicture} alt="Profile Photo" />
              <AvatarFallback>
                {group.user?.username?.slice(0, 2)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          {/* <img
            src={group.user.profilePicture}
            alt={group.user.username}
            className="
              block
              w-full
              h-full
              rounded-full
              object-cover
              border-2
              border-white
            "
          /> */}
        </div>
      </div>

      <span
        className="
          text-xs
          mt-1
          max-w-[72px]
          truncate
          text-center
        "
      >
        {group.user.username}
      </span>
    </button>
  );
}