const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- 1. הרשמה רגילה ---
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // בדיקה אם המשתמש קיים
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User or Email already exists' });
    }

    // הצפנת סיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // יצירת משתמש
    const user = await User.create({
      username,
      email,
      password: hashedPassword, 
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        message: 'User Registered Successfully'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. התחברות רגילה ---
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    // בודקים אם המשתמש קיים, אם יש לו סיסמה (למשתמשי גוגל אין), ואם הסיסמה תואמת
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        message: 'Login Successful'
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. התחברות/הרשמה עם Google ---
const googleLogin = async (req, res) => {
  try {
    const { email, username, googleId } = req.body;

    // בדיקה אם המשתמש כבר קיים לפי אימייל
    let user = await User.findOne({ email });

    if (user) {
      // משתמש קיים - מחזירים פרטים
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        message: 'Google Login Successful'
      });
    } else {
      // משתמש חדש - יוצרים אותו (בלי סיסמה!)
      
      // טיפול בשם משתמש תפוס: אם "David" תפוס, נשנה ל-"David123"
      let finalUsername = username;
      const userNameExists = await User.findOne({ username });
      if (userNameExists) {
        finalUsername = username + Math.floor(Math.random() * 1000);
      }

      user = await User.create({
        username: finalUsername,
        email,
        googleId, 
        // אין צורך בסיסמה כי הגדרנו במודל required: false
      });

      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        message: 'Google User Created Successfully'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin };