/**
 * Configuration du store Redux avec redux-persist
 * Seul le slice "recordings" est persisté dans AsyncStorage
 * pour conserver les enregistrements entre les sessions
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import serverReducer from './serverSlice';
import recordingsReducer from './recordingsSlice';
import raveReducer from './raveSlice';

// Configuration de la persistance : seul "recordings" est sauvegardé
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['recordings'],
};

const rootReducer = combineReducers({
  server: serverReducer,
  recordings: recordingsReducer,
  rave: raveReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Ignorer les vérifications de sérialisation pour redux-persist
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés pour utiliser dispatch et selector dans les composants
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
