const router = require('express').Router();
const ctrl = require('../controllers/feedback.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authenticate, authorize('customer'), upload.single('image'), validate(schemas.feedback), ctrl.submit);
router.get('/:productId', authenticate, ctrl.getByProduct);

module.exports = router;
