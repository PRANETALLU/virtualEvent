const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
  login, 
  signup, 
  logout, 
  getUserInfo, 
  updatePreferences, 
  getRecommendations, 
  updateUserProfile,
  forgotPassword,
  resetPassword
} = require('../controllers/userController');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

router.put('/:id', upload.single('avatar'), updateUserProfile);
router.get('/:id/recommendations', getRecommendations);
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/:id', getUserInfo);
router.put('/:id/preferences', updatePreferences);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;