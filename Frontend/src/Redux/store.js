import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authSlice,{ setAuthUser } from "./authslice.js";
import postSlice from './postSlice.js';
import chatSlice from './chatSlice.js';
import socketSlice from './socketSlice.js';
import rtnSlice from './rtnSlice.js';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'


const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  blacklist: ['socketio'],
}

const rootReducer = combineReducers({
   auth :authSlice,
   post : postSlice,  
   socketio : socketSlice,
   chat : chatSlice,
   realTimeNotification : rtnSlice,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['socketio.socket'],
      },
    }),
});

export default store;