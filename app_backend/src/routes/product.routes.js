const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/create', authenticate, authorize('ngo'), upload.single('image'), validate(schemas.productCreate), ctrl.create);
router.get('/', authenticate, ctrl.getAll);
router.get('/:productId', authenticate, ctrl.getById);
router.get('/:productId/history', authenticate, ctrl.getHistory);
router.get('/:productId/qr', authenticate, authorize('ngo', 'warehouse', 'distributor', 'retailer'), ctrl.getQR);

module.exports = router;
