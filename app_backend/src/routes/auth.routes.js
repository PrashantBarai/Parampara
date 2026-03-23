const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { validate, schemas } = require('../middlewares/validate.middleware');

router.post('/register', validate(schemas.register), ctrl.register);
router.post('/login', validate(schemas.login), ctrl.login);

module.exports = router;
