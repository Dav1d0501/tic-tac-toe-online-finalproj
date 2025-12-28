import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import HomePage from './Pages/HomePage';
import GamePage from './Pages/GamePage';
import AuthPage from './Pages/AuthPage';
import Lobby from './Pages/Lobby'; 
import './App.css';

// --- התיקון הקריטי כאן ---
// אנחנו בודקים: האם יש כתובת שרת במשתני הסביבה? אם כן - קח אותה. אם לא - קח את לוקהוסט.
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io.connect(SOCKET_URL);
// -----------------------

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        {/* דף הבית מוגן */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        
        {/* דף הלובי מוגן */}
        <Route 
          path="/lobby" 
          element={
            <ProtectedRoute>
              <Lobby socket={socket} />
            </ProtectedRoute>
          } 
        />

        {/* דף המשחק מוגן */}
        <Route 
          path="/game/:mode" 
          element={
            <ProtectedRoute>
              <GamePage socket={socket} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;