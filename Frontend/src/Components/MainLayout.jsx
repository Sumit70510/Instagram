import React, { useContext } from "react";
import { Outlet } from "react-router-dom";

import LeftSidebar from "./LeftSidebar.jsx";
import MobileUI from "./MobileUI.jsx";
import useTheme from "@/Redux/theme.js";
import { ScrollContext } from "../App.jsx";

export default function MainLayout() {
  const { themeMode } = useTheme();
  const { scrollContainerRef } = useContext(ScrollContext);

  const isDark = themeMode === "dark";

  return (
    <div
      className={`
        min-h-dvh w-full overflow-hidden
        ${
          isDark
            ? "bg-black text-white"
            : "bg-white text-gray-950"
        }
      `}
    >
      {/* Desktop sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 hidden border-r
          md:block md:w-[72px] xl:w-[245px]
          ${
            isDark
              ? "border-zinc-800 bg-black"
              : "border-gray-200 bg-white"
          }
        `}
      >
        <LeftSidebar />
      </aside>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <MobileUI />
      </div>

      {/* Single application outlet and scroll container */}
      <main
        ref={scrollContainerRef}
        className={`
          h-dvh w-full overflow-y-auto overflow-x-hidden
          pt-12 pb-[calc(56px+env(safe-area-inset-bottom))]
          md:ml-[72px] md:w-[calc(100%-72px)]
          md:pt-0 md:pb-0
          xl:ml-[245px] xl:w-[calc(100%-245px)]
          ${isDark ? "bg-black" : "bg-white"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}