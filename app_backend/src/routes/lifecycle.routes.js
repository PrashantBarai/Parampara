const router = require('express').Router();
const ctrl = require('../controllers/lifecycle.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/add-stage', authenticate, authorize('warehouse', 'distributor', 'retailer'), upload.single('image'), validate(schemas.lifecycleAdd), ctrl.addStage);
router.get('/:productId', authenticate, ctrl.getJourney);

module.exports = router;
