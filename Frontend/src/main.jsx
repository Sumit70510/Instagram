import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Toaster } from 'sonner';
import { Provider } from 'react-redux';
import store from './Redux/store.js';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { ThemeProvider } from './Redux/theme.js';

let persistor = persistStore(store);

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
        <Toaster />
      </PersistGate>
    </Provider>
  </ThemeProvider>,
);
