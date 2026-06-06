import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx'
import { Button } from './ui/button.jsx'
import api from '@/Lib/api.js'
import { toast } from 'sonner'
import { setAuthUser } from '@/Redux/authslice.js'
import { Search, X } from 'lucide-react'
import useTheme from '@/Redux/theme.js'

export default function SearchUser() {
  const dispatch = useDispatch()
  const { user } = useSelector(store => store.auth)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690)
  const { themeMode } = useTheme();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 690)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const searchHandler = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const res = await api.get(`/user/search?query=${query}`)

      if (res.data.success) {
        setSearchResults(res.data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to search users')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    searchHandler(value)
  }

  const followHandler = useCallback(
    async (userId) => {
      try {
        const res = await api.post(
          `/user/followorunfollow/${userId}`
        )

        if (res.data.success) {
          const updatedFollowing = user?.following?.includes(userId)
            ? user.following.filter(id => id !== userId)
            : [...(user?.following || []), userId]

          dispatch(setAuthUser({ ...user, following: updatedFollowing }))
          
          // Update search results
          setSearchResults(
            searchResults.map(u =>
              u._id === userId
                ? {
                    ...u,
                    followers: user?.following?.includes(userId)
                      ? u.followers.filter(id => id !== user._id)
                      : [...u.followers, user._id]
                  }
                : u
            )
          )

          toast.success(res.data.message)
        }
      } catch (error) {
        console.log(error)
        toast.error(error.response?.data?.message || 'Failed to follow/unfollow')
      }
    },
    [user, dispatch, searchResults]
  )

  const clearSearch = () => {
    setSearchInput('')
    setSearchResults([])
    setHasSearched(false)
  }

  return (
    <div className={`flex h-full justify-center scroll-smooth overflow-y-hidden ${isMobile ? '' : 'mt-6 p-4 ml-[16%]'}`}>
      <div className={`flex flex-col h-full w-full max-w-full box-border scroll-smooth ${themeMode === 'dark' ? 'bg-black text-slate-100' : 'bg-white text-slate-950'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 p-4 ${themeMode === 'dark' ? 'bg-black border-b border-zinc-900' : 'bg-white border-b border-gray-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Search className={`w-5 h-5 ${themeMode === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
          <input
            type="text"
            placeholder="Search users by username..."
            value={searchInput}
            onChange={handleSearchChange}
            className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus-visible:ring-transparent ${
              themeMode === 'dark'
                ? 'bg-zinc-900 text-slate-100 placeholder-slate-400 border border-zinc-800'
                : 'bg-gray-100 text-slate-950 placeholder-gray-500 border border-gray-300'
            }`}
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className={`p-1 rounded-full ${themeMode === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Container */}
      <div className={`flex-1 overflow-y-auto hide-scrollbar`}>
        {isSearching && (
          <div className={`flex items-center justify-center h-32 ${themeMode === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
            <p>Searching...</p>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length === 0 && (
          <div className={`flex items-center justify-center h-32 ${themeMode === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
            <p>No users found</p>
          </div>
        )}

        {!hasSearched && !isSearching && (
          <div className={`flex items-center justify-center h-32 ${themeMode === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
            <p>Start searching for users...</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className={`divide-y ${isMobile ? 'divide-zinc-900' : 'divide-gray-200'}`}>
            {searchResults.map((searchUser) => {
              const isFollowing = user?.following?.includes(searchUser._id)
              const isOwnProfile = user?._id === searchUser._id

              return (
                <div
                  key={searchUser._id}
                  className={`p-4 flex items-center justify-between ${
                    themeMode === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  {/* User Info */}
                  <Link
                    to={`/profile/${searchUser._id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarImage src={searchUser?.profilePicture} alt={searchUser?.username} />
                      <AvatarFallback>
                        {searchUser?.username?.slice(0, 2)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate ${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>
                        {searchUser?.username}
                      </p>
                      <p className={`text-sm truncate ${themeMode === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                        {searchUser?.followers?.length || 0} followers
                      </p>
                    </div>
                  </Link>

                  {/* Follow/Unfollow Button */}
                  {!isOwnProfile && (
                    <Button
                      onClick={() => followHandler(searchUser._id)}
                      className={`ml-2 shrink-0 ${
                        isFollowing
                          ? themeMode === 'dark'
                            ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800'
                            : 'bg-gray-200 text-slate-950 hover:bg-gray-300'
                          : themeMode === 'dark'
                          ? 'bg-zinc-900 text-slate-100 hover:bg-zinc-800'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
