const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    googleLogin, 
    getLeaderboard,   
    addFriend,        
    getUserFriends    
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);

router.get('/leaderboard', getLeaderboard);
router.post('/add-friend', addFriend);
router.get('/friends/:userId', getUserFriends);

module.exports = router;