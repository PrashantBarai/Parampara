const router = require('express').Router();
const ctrl = require('../controllers/return.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/initiate', authenticate, authorize('customer'), upload.single('image'), validate(schemas.returnInitiate), ctrl.initiate);
router.put('/:returnId/receive', authenticate, authorize('warehouse'), ctrl.receive);
router.put('/:returnId/repair', authenticate, authorize('warehouse'), ctrl.repair);
router.get('/product/:productId', authenticate, ctrl.getHistory);

module.exports = router;
