import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// שליפת מזהה הלקוח ממשתני הסביבה
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error("Missing Google Client ID in .env file!");
}

ReactDOM.createRoot(document.getElementById('root')).render(
    // ספק ההזדהות של גוגל עוטף את כל האפליקציה
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
);