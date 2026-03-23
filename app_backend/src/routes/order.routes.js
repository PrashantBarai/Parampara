const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.post('/create', authenticate, authorize('customer'), ctrl.create);

module.exports = router;
