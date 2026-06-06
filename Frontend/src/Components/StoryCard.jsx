export default function StoryCard({ group, onClick }) {
  const ringClass = 'bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]';
  const story = group.stories?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer rounded-3xl transition hover:scale-[1.03] focus:outline-none box-border self-center"
    >
      <div className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 md:h-[84px] md:w-[84px] shrink-0">
        <div className={`${ringClass} rounded-full box-border w-full h-full flex items-center justify-center`}> 
          <img
            src={group.user.profilePicture}
            alt={group.user.username}
            className="block w-full h-full rounded-full object-cover border-2 border-white"
          />
        </div>
      </div>

      <span className="text-xs mt-1 max-w-[72px] truncate text-center">
        {group.user.username}
      </span>
    </button>
  );
}