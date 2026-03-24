const router = require('express').Router();
const ctrl = require('../controllers/transfer.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');

router.post('/', authenticate, authorize('ngo', 'manufacturer', 'warehouse', 'distributor', 'retailer'), validate(schemas.transfer), ctrl.transfer);

module.exports = router;
