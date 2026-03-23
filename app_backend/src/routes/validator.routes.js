const router = require('express').Router();
const ctrl = require('../controllers/validator.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// NGO registers artisan
router.post('/artisan/register', authenticate, authorize('ngo'), upload.single('giCertificate'), validate(schemas.artisanRegister), ctrl.registerArtisan);
// Validator gets pending
router.get('/artisan/pending', authenticate, authorize('validator'), ctrl.getPending);
// Validator verifies
router.post('/artisan/:artisanId/verify', authenticate, authorize('validator'), validate(schemas.artisanVerify), ctrl.verify);
// NGO or Validator flags
router.post('/artisan/:artisanId/flag', authenticate, authorize('ngo', 'validator'), ctrl.flag);
// Anyone can view artisan
router.get('/artisan/:artisanId', authenticate, ctrl.getArtisan);

module.exports = router;
