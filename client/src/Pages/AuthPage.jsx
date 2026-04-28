import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "./AuthPage.css";

// --- SVG Icons Components ---
const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const calculatePupilOffset = (ref, mouseX, mouseY, maxDistance, forceLookX, forceLookY) => {
  if (!ref.current) return { x: 0, y: 0 };
  if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

  const element = ref.current.getBoundingClientRect();
  const centerX = element.left + element.width / 2;
  const centerY = element.top + element.height / 2;

  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

  const angle = Math.atan2(deltaY, deltaX);
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return { x, y };
};

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY, mouseX, mouseY }) => {
  const pupilRef = useRef(null);
  
  const pupilPosition = calculatePupilOffset(pupilRef, mouseX, mouseY, maxDistance, forceLookX, forceLookY);

  return (
    <div
      ref={pupilRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        borderRadius: "50%",
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY, mouseX, mouseY }) => {
  const eyeRef = useRef(null);
  
  const pupilPosition = calculatePupilOffset(eyeRef, mouseX, mouseY, maxDistance, forceLookX, forceLookY);

  return (
    <div
      ref={eyeRef}
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "height 0.15s ease",
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            borderRadius: "50%",
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

// --- Main Auth Page ---
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

  // Animation states
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  // Single Mouse Listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const timeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
      return timeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const timeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
      return timeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword]);

  const calculatePosition = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!isLogin) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setMessage("Please enter a valid email address");
        return;
      }
      const strictPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\^#\-\_]).{8,}$/;
      if (!strictPasswordRegex.test(password)) {
        setMessage("Password must be 8+ chars, 1 Uppercase, 1 Number & 1 Special char");
        return;
      }
    }

    const endpoint = isLogin ? "login" : "register";
    const payload = isLogin ? { username, password } : { username, email, password };

    try {
      const response = await fetch(`${API_URL}/api/users/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        handleSuccess(data);
      } else {
        setMessage(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setMessage("Server error. Please try again later.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await fetch(`${API_URL}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decoded.email,
          username: decoded.name,
          googleId: decoded.sub,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        handleSuccess(data);
      } else {
        setMessage(data.message || "Google Login Failed");
      }
    } catch (error) {
      console.error("Google Login Error", error);
      setMessage("Server Error during Google Login");
    }
  };

  const handleSuccess = (userData) => {
    setMessage(`Success! Welcome ${userData.username}`);
    localStorage.setItem("user", JSON.stringify(userData));
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="brand-header">
          <span>ArenaX</span>
        </div>

        <div className="character-container">
          <div
            ref={purpleRef}
            style={{
              position: "absolute",
              bottom: 0,
              left: "70px",
              width: "180px",
              height: isTyping || (password.length > 0 && !showPassword) ? "440px" : "400px",
              backgroundColor: "#800020",
              borderRadius: "10px 10px 0 0",
              zIndex: 1,
              transition: "all 0.7s ease-in-out",
              transform: password.length > 0 && showPassword
                ? `skewX(0deg)`
                : isTyping || (password.length > 0 && !showPassword)
                ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                : `skewX(${purplePos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div style={{
              position: "absolute",
              display: "flex",
              gap: "32px",
              transition: "all 0.7s ease-in-out",
              left: password.length > 0 && showPassword ? "20px" : isLookingAtEachOther ? "55px" : `${45 + purplePos.faceX}px`,
              top: password.length > 0 && showPassword ? "35px" : isLookingAtEachOther ? "65px" : `${40 + purplePos.faceY}px`,
            }}>
              <EyeBall size={18} pupilSize={7} isBlinking={isPurpleBlinking} forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              <EyeBall size={18} pupilSize={7} isBlinking={isPurpleBlinking} forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} mouseX={mouseX} mouseY={mouseY} />
            </div>
          </div>

          <div
            ref={blackRef}
            style={{
              position: "absolute",
              bottom: 0,
              left: "240px",
              width: "120px",
              height: "310px",
              backgroundColor: "#1e1b1b",
              borderRadius: "8px 8px 0 0",
              zIndex: 2,
              transition: "all 0.7s ease-in-out",
              transform: password.length > 0 && showPassword
                ? `skewX(0deg)`
                : isLookingAtEachOther
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                : isTyping || (password.length > 0 && !showPassword)
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                : `skewX(${blackPos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div style={{
              position: "absolute",
              display: "flex",
              gap: "24px",
              transition: "all 0.7s ease-in-out",
              left: password.length > 0 && showPassword ? "10px" : isLookingAtEachOther ? "32px" : `${26 + blackPos.faceX}px`,
              top: password.length > 0 && showPassword ? "28px" : isLookingAtEachOther ? "12px" : `${32 + blackPos.faceY}px`,
            }}>
              <EyeBall size={16} pupilSize={6} isBlinking={isBlackBlinking} forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              <EyeBall size={16} pupilSize={6} isBlinking={isBlackBlinking} forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
            </div>
          </div>

          <div
            ref={orangeRef}
            style={{
              position: "absolute",
              bottom: 0,
              left: "0px",
              width: "240px",
              height: "200px",
              zIndex: 3,
              backgroundColor: "#FF9B6B",
              borderRadius: "120px 120px 0 0",
              transition: "all 0.7s ease-in-out",
              transform: password.length > 0 && showPassword ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div style={{
              position: "absolute",
              display: "flex",
              gap: "32px",
              transition: "all 0.2s ease-out",
              left: password.length > 0 && showPassword ? "50px" : `${82 + (orangePos.faceX || 0)}px`,
              top: password.length > 0 && showPassword ? "85px" : `${90 + (orangePos.faceY || 0)}px`,
            }}>
              <Pupil size={12} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              <Pupil size={12} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
            </div>
          </div>

          <div
            ref={yellowRef}
            style={{
              position: "absolute",
              bottom: 0,
              left: "310px",
              width: "140px",
              height: "230px",
              backgroundColor: "#E8D754",
              borderRadius: "70px 70px 0 0",
              zIndex: 4,
              transition: "all 0.7s ease-in-out",
              transform: password.length > 0 && showPassword ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div
              style={{
                position: "absolute",
                display: "flex",
                gap: "24px",
                transition: "all 0.2s ease-out",
                left: password.length > 0 && showPassword ? "20px" : `${52 + (yellowPos.faceX || 0)}px`,
                top: password.length > 0 && showPassword ? "35px" : `${40 + (yellowPos.faceY || 0)}px`,
              }}
            >
              <Pupil size={12} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              <Pupil size={12} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
            </div>
            <div style={{
              position: "absolute",
              width: "80px",
              height: "4px",
              backgroundColor: "#2D2D2D",
              borderRadius: "4px",
              transition: "all 0.2s ease-out",
              left: password.length > 0 && showPassword ? "10px" : `${40 + (yellowPos.faceX || 0)}px`,
              top: password.length > 0 && showPassword ? "88px" : `${88 + (yellowPos.faceY || 0)}px`,
            }} />
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h1 className="auth-title">{isLogin ? "Welcome back!" : "Create Account"}</h1>
          <p className="auth-subtitle">{isLogin ? "Please enter your details" : "Join the arena today"}</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Player Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="auth-input"
                required
              />
            </div>

            {!isLogin && (
              <div className="auth-input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  className="auth-input"
                  required
                />
              </div>
            )}

            <div className="auth-input-group">
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="auth-input"
                style={{ paddingRight: "50px" }}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>

            {!isLogin && (
              <div style={{ fontSize: "0.75rem", color: "#887a7a", marginBottom: "15px" }}>
                Needs: 8+ chars, 1 Uppercase, 1 Number, 1 Special character
              </div>
            )}

            {message && (
              <div className={`auth-message ${message.includes("Success") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {isLogin ? "Log in" : "Register"}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line"></div>
            <span className="auth-divider-text">OR</span>
            <div className="auth-divider-line"></div>
          </div>

          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setMessage("Google Login Failed")}
              theme="filled_black"
              shape="pill"
              text={isLogin ? "signin_with" : "signup_with"}
            />
          </div>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setMessage(""); }}>
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;