const User = require('../models/User');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User or Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
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

const googleLogin = async (req, res) => {
  try {
    const { email, username, googleId } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        message: 'Google Login Successful'
      });
    } else {
      // המשתמש לא קיים - ניצור אותו אוטומטית!
      // נמציא לו סיסמה ארוכה ומסובכת כי הוא לא ישתמש בה לעולם
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // ניסיון ליצור משתמש. אם השם תפוס, נוסיף לו מספרים
      let finalUsername = username;
      const userNameExists = await User.findOne({ username });
      if (userNameExists) {
        finalUsername = username + Math.floor(Math.random() * 1000);
      }

      user = await User.create({
        username: finalUsername,
        email,
        password: hashedPassword,
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

module.exports = { registerUser, loginUser, googleLogin};