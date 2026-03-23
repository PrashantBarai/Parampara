const router = require('express').Router();
const ctrl = require('../controllers/verify.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/image', authenticate, upload.single('image'), ctrl.verifyImage);

module.exports = router;
