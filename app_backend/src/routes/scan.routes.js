const router = require('express').Router();
const ctrl = require('../controllers/scan.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validate.middleware');

router.post('/', optionalAuth, validate(schemas.scan), ctrl.scan);

module.exports = router;
