const router = require('express').Router();
const ctrl = require('../controllers/token.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');

router.get('/balance', authenticate, authorize('validator'), ctrl.getBalance);
router.get('/transactions', authenticate, authorize('validator'), ctrl.getTransactions);
router.post('/redeem', authenticate, authorize('validator'), validate(schemas.tokenRedeem), ctrl.redeem);

module.exports = router;
