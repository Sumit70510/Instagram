// import store from '@/Redux/store.js';
// import React from 'react'
// import { useSelector } from 'react-redux';
// import { Link } from 'react-router';
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';

// export default function SuggestedUsers() {
// //   const {user} = useSelector(state=>state.auth);  
//   const { suggestedUsers = [] } = useSelector((store) => store.auth);

//   return(
//     <div className='my-10'>
//       <div className='flex items-center justify-between text-sm gap-2'>
//          <h1 className='font-semibold text-gray-600'>
//           Suggested Fou You
//          </h1>
//          <span className='font-medium cursor-pointer'>
//            See All
//          </span>     
//        </div>
//       {
//           suggestedUsers.map((user)=>{
//            return (
//             <div key={user._id} className="flex my-5 items-center gap-3 justify-between">
//              <Link to={`/profile/${user._id}`} className="flex items-center gap-2">
//               <Avatar>
//                <AvatarImage src={user?.profilePicture} />
//                <AvatarFallback>
//                 {user?.username?.slice(0, 2)?.toUpperCase()}
//                </AvatarFallback>
//               </Avatar>
//               <div className="w-6">
//                 {user?.username}
//                 {/* <span className="text-gray-600 text-sm">{user?.bio}</span> */}
//               </div>
//              </Link>
//              <span className="text-[#3BADF8] text-xs font-bold cursor-pointer hover:text-[#3495d6]">
//                Follow
//              </span>
//             </div>
//            )   
//       })
//      }
//      </div>
//   )
// }

import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import axios from "axios";
import { toast } from "sonner";
import { setAuthUser } from "@/Redux/authslice.js";

export default function SuggestedUsers() {
  const dispatch = useDispatch();
  const { suggestedUsers = [], user } = useSelector((store) => store.auth);

  const filteredSuggestions = suggestedUsers.filter(
    (u) => !user?.following?.includes(u._id)
  );

  const followHandler = useCallback(
    async (id) => {
      try {
        const res = await api.post(
          `/user/followorunfollow/${id}`
        );

        if (res.data.success) {
          const updatedFollowing = [...user.following, id];

          dispatch(setAuthUser({ ...user, following: updatedFollowing }));
          toast.success(res.data.message);
        } else {
          toast.error(res.data.message);
        }
      } catch (error) {
        console.log(error);
      }
    },
    [user, dispatch]
  );

return (
  <div className="my-10">
    <div className="flex items-center justify-between text-sm gap-2">
      <h1 className="font-semibold text-gray-600">Suggested For You</h1>
      <span className="font-medium cursor-pointer">See All</span>
    </div>

    {filteredSuggestions.length === 0 && (
      <p className="text-sm text-gray-500 mt-4">No suggestions available</p>
    )}

    {filteredSuggestions.map((u) => (
      <div
        key={u._id}
        className="flex my-5 items-center gap-3 justify-between"
      >
        {/* LEFT SIDE: Avatar + username */}
        <Link to={`/profile/${u._id}`} className="flex items-center gap-2 grow min-w-0">
          <Avatar>
            <AvatarImage src={u?.profilePicture} />
            <AvatarFallback>
              {u?.username?.slice(0, 2)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Username trimmed cleanly */}
          <span className="text-sm font-medium truncate max-w-[120px]">
            {u?.username}
          </span>
        </Link>

        {/* RIGHT SIDE: Follow button */}
        <span
          onClick={() => followHandler(u._id)}
          className="text-[#3BADF8] text-xs font-bold cursor-pointer hover:text-[#3495d6] whitespace-nowrap"
        >
          Follow
        </span>
      </div>
    ))}
  </div>
);
}