const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');
const config = require('./index');

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const storage = cloudinaryStorage({
  cloudinary,
  folder: 'restaurant-saas',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = { cloudinary: cloudinary.v2, upload };
