import React from "react";

import Feed from "./Feed.jsx";
import RightSidebar from "./RightSidebar.jsx";
import useGetAllPost from "@/Hooks/useGetAllPost.jsx";
import useGetSuggestedUsers from "@/Hooks/useGetSuggestedUsers.jsx";
import useTheme from "@/Redux/theme.js";

export default function Home() {
  useGetAllPost();
  useGetSuggestedUsers();

  const { themeMode } = useTheme();
  const isDark = themeMode === "dark";

  return (
    <div
      className={`
        min-h-full w-full
        ${
          isDark
            ? "bg-black text-white"
            : "bg-white text-gray-950"
        }
      `}
    >
      <div
        className="
          mx-auto grid w-full max-w-[1060px]
          grid-cols-1
          lg:grid-cols-[minmax(0,630px)_300px]
          lg:justify-center lg:gap-8 xl:gap-12
        "
      >
        <section className="min-w-0">
          <Feed />
        </section>

        <aside className="hidden min-w-0 lg:block">
          <div
            className="
              sticky top-0 max-h-dvh overflow-y-auto
              px-2 py-8 hide-scrollbar
            "
          >
            <RightSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}