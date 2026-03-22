const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mizuka_audio_messages', 
    resource_type: 'auto',    
    allowed_formats: ['webm', 'mp3', 'wav', 'ogg', 'm4a'], 
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Please upload an audio file.'), false);
  }
};

const uploadAudio = multer({ storage, fileFilter });

module.exports = uploadAudio;