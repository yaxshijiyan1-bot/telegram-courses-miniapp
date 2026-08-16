import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TelegramProvider } from './context/TelegramContext';
import { AuthProvider } from './context/AuthContext';
import 'generative-loaders/styles.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TelegramProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TelegramProvider>
  </React.StrictMode>,
);
