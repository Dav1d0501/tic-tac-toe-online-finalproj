import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; 

// רכיב אייקון חץ (מחליף את lucide-react כדי לחסוך התקנות)
const ArrowRightIcon = () => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// רכיב התפריט האנכי (משתמש ב-CSS Transitions במקום Framer Motion)
const MenuVertical = ({ menuItems = [] }) => {
  return (
    <div className="menu-vertical-container">
      {menuItems.map((item, index) => (
        <div 
            key={index} 
            className="menu-item-group"
            onClick={item.action}
        >
          <div className="menu-arrow-container">
            <ArrowRightIcon />
          </div>
          <div className="menu-text">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// רכיב עמוד הבית המרכזי
const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload(); 
  };

  // כאן אנחנו מגדירים את אפשרויות התפריט ולאן כל אחת מנווטת
  const mainMenuItems = [
    { label: "Play Local", action: () => navigate('/game/local') },
    { label: "Play vs Computer", action: () => navigate('/game/computer') },
    { label: "Play Online", action: () => navigate('/lobby') }
  ];

  return (
    <div className="home-container">
      
      {/* שורת משתמש עליונה */}
      <div className="top-bar">
        <div className="user-greeting">
          Welcome, <span className="user-highlight">{user ? user.username : 'Guest'}</span>
        </div>
        
        <button onClick={handleLogout} className="home-logout-btn">
          Logout
        </button>
      </div>

      {/* תוכן מרכזי */}
      <div className="home-content">
        <h1 className="home-title">ArenaX</h1>
        
        {/* קריאה לתפריט המונפש שהכנו למעלה */}
        <MenuVertical menuItems={mainMenuItems} />
      </div>

    </div>
  );
};

export default HomePage;