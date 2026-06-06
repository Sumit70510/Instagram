import { PlusIcon } from 'lucide-react';
import StoryCard from './StoryCard.jsx';

export default function StoryBar({ groups = [], currentUser, onGroupClick, onCreateStory }) {
  const ownGroupIndex = groups.findIndex((group) => String(group.user?._id) === String(currentUser?._id));
  const hasOwnGroup = ownGroupIndex !== -1;
  const otherGroups = groups.filter((group) => String(group.user?._id) !== String(currentUser?._id));

  return (
    <div className="flex gap-3 overflow-x-auto p-2 sm:p-4 rounded-xl items-center bg-transparent backdrop-blur-sm md:bg-white/60 md:dark:bg-zinc-900/60">
      <div className="flex flex-col items-center self-center">
        <button
          type="button"
          onClick={() => (hasOwnGroup ? onGroupClick?.(ownGroupIndex) : onCreateStory?.())}
          className={`relative flex h-16 w-16 sm:h-20 sm:w-20 md:h-[84px] md:w-[84px] shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-center shadow-sm transition hover:shadow-md focus:outline-none box-border`}
          aria-label="Your story"
        >
          <div className={`w-full h-full flex items-center justify-center ${hasOwnGroup ? 'p-[3px] bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600' : ''} rounded-full box-border`}>
            <img
              src={currentUser?.profilePicture || '/default.jpg'}
              alt={currentUser?.username || 'Your story'}
              className="h-full w-full rounded-full object-cover border-2 border-white dark:border-zinc-900"
            />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCreateStory?.();
            }}
            className="absolute bottom-1.5 right-1.5 md:bottom-0 md:right-0 h-6 w-6 sm:h-7 sm:w-7 md:h-7 md:w-7 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 bg-blue-500 text-white shadow-lg"
            role="button"
            aria-label="Add story"
          >
            <PlusIcon className="h-4 w-4" />
          </div>
        </button>
        <span className="text-xs mt-1 text-slate-500 dark:text-slate-400">
          Your story
        </span>
      </div>

      {otherGroups.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">No stories available yet.</div>
      ) : (
        otherGroups.map((group, index) => (
          <StoryCard
            key={group.user._id}
            group={group}
            onClick={() => onGroupClick?.(hasOwnGroup ? index + 1 : index)}
          />
        ))
      )}
    </div>
  );
}
