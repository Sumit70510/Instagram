import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Posts from './Posts.jsx';
import StoryBar from './StoryBar.jsx';
import StoryViewer from './StoryViewer.jsx';
import CreateStory from './CreateStory.jsx';
import api from '@/Lib/api.js';

export default function Feed() {
  const [stories, setStories] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);

  const storyGroups = useMemo(() => {
    const grouped = new Map();

    stories.forEach((story) => {
      const userId = story.user?._id || story.user;
      const group = grouped.get(userId) || { user: story.user, stories: [] };
      group.stories.push(story);
      grouped.set(userId, group);
    });

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        stories: group.stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      }))
      .sort((a, b) => {
        if (a.user?._id === user?._id) return -1;
        if (b.user?._id === user?._id) return 1;
        const aLatest = a.stories[a.stories.length - 1]?.createdAt || 0;
        const bLatest = b.stories[b.stories.length - 1]?.createdAt || 0;
        return new Date(bLatest) - new Date(aLatest);
      });
  }, [stories, user]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await api.get('/story');
        if (res.data.success) {
          setStories(res.data.stories || []);
        }
      } catch (error) {
        console.error('Failed to load stories', error);
      }
    };

    fetchStories();
  }, []);

  const openStoryAt = async (groupIndex, storyIndex = 0, resetPaused = false) => {
    setSelectedGroupIndex(groupIndex);
    setSelectedStoryIndex(storyIndex);
    setStoryProgress(0);
    if (resetPaused) {
      setIsPaused(false);
    }

    const story = storyGroups[groupIndex]?.stories?.[storyIndex];
    if (!story) return;

    try {
      await api.post(`/story/${story._id}/view`);
    } catch (error) {
      console.error('Failed to mark story as viewed', error);
    }
  };

  const handleNextStory = () => {
    if (selectedGroupIndex === null) return;
    const currentGroup = storyGroups[selectedGroupIndex];
    if (!currentGroup) return;

    if (selectedStoryIndex < currentGroup.stories.length - 1) {
      openStoryAt(selectedGroupIndex, selectedStoryIndex + 1);
      return;
    }

    if (selectedGroupIndex < storyGroups.length - 1) {
      openStoryAt(selectedGroupIndex + 1, 0);
      return;
    }

    setSelectedGroupIndex(null);
    setSelectedStoryIndex(0);
    setStoryProgress(0);
  };

  const handlePrevStory = () => {
    if (selectedGroupIndex === null) return;
    const currentGroup = storyGroups[selectedGroupIndex];
    if (!currentGroup) return;

    if (selectedStoryIndex > 0) {
      openStoryAt(selectedGroupIndex, selectedStoryIndex - 1);
      return;
    }

    if (selectedGroupIndex > 0) {
      const previousGroup = storyGroups[selectedGroupIndex - 1];
      if (!previousGroup) return;
      openStoryAt(selectedGroupIndex - 1, previousGroup.stories.length - 1);
    }
  };

  useEffect(() => {
    const STORY_DURATION = 15000;

    if (selectedGroupIndex === null) {
      setStoryProgress(0);
      return undefined;
    }
    if (isPaused) {
      return undefined;
    }

    const startPercent = storyProgress;
    const remainingTime = STORY_DURATION * Math.max(0, 1 - startPercent / 100);
    const startTime = Date.now();

    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(
        100,
        startPercent + (elapsed / remainingTime) * (100 - startPercent),
      );
      setStoryProgress(nextProgress);
    }, 50);

    const autoPlayTimer = window.setTimeout(() => {
      setStoryProgress(100);
      handleNextStory();
    }, remainingTime);

    return () => {
      window.clearInterval(progressInterval);
      window.clearTimeout(autoPlayTimer);
    };
  }, [selectedGroupIndex, selectedStoryIndex, isPaused, storyGroups]);

  const handleStoryCreated = (story) => {
    setStories((prev) => [story, ...prev]);
  };

  const selectedGroup = selectedGroupIndex !== null ? storyGroups[selectedGroupIndex] : null;

  return (
    <div className="flex-1 my-8 flex flex-col hide-scrollbar items-center">
      <div className="w-full max-w-3xl px-2">
        <StoryBar
          groups={storyGroups}
          currentUser={user}
          onGroupClick={(index) => openStoryAt(index, 0, true)}
          onCreateStory={() => setIsCreateOpen(true)}
        />
        <Posts />
      </div>
      <StoryViewer
        group={selectedGroup}
        groupIndex={selectedGroupIndex}
        storyIndex={selectedStoryIndex}
        totalGroups={storyGroups.length}
        storyProgress={storyProgress}
        isPaused={isPaused}
        onTogglePlay={() => setIsPaused((prev) => !prev)}
        onClose={() => setSelectedGroupIndex(null)}
        onPrevGroup={() => {
          if (selectedGroupIndex === null) return;
          const prevIndex = selectedGroupIndex - 1;
          if (prevIndex >= 0) openStoryAt(prevIndex, 0, false);
        }}
        onNextGroup={() => {
          if (selectedGroupIndex === null) return;
          const nextIndex = selectedGroupIndex + 1;
          if (nextIndex < storyGroups.length) openStoryAt(nextIndex, 0, false);
        }}
        onPrevStory={handlePrevStory}
        onNextStory={handleNextStory}
      />
      <CreateStory
        open={isCreateOpen}
        setOpen={setIsCreateOpen}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
}

