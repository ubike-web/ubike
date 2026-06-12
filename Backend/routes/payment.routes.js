const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/initialize',
  authMiddleware.authUser,
  body('amount').isNumeric(),
  body('email').isEmail(),
  paymentController.initialize
);

router.post('/confirm-first',
  authMiddleware.authUser,
  body('reference').isString().notEmpty(),
  body('pickup').isString().isLength({ min: 3 }),
  body('destination').isString().isLength({ min: 3 }),
  body('vehicleType').isIn(['auto', 'car', 'bike']),
  paymentController.confirmFirst
);

router.post('/confirm-second',
  authMiddleware.authUser,
  body('reference').isString().notEmpty(),
  body('rideId').isUUID(),
  paymentController.confirmSecond
);

router.get('/wallet', authMiddleware.authUser, paymentController.getWallet);

router.post('/topup', authMiddleware.authUser, paymentController.topup);

router.get('/captain-wallet', authMiddleware.authCaptain, paymentController.getCaptainWallet);

module.exports = router;
