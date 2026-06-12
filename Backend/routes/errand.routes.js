const express = require('express');
const router = express.Router();
const errandController = require('../controllers/errand.controller');
const { authUser } = require('../middlewares/auth.middleware');
const { authCaptain } = require('../middlewares/auth.middleware');

// User routes
router.get('/fare', authUser, errandController.getErrandFare);
router.post('/create', authUser, errandController.createErrand);
router.get('/my', authUser, errandController.getMyErrands);

// Captain routes
router.post('/confirm', authCaptain, errandController.confirmErrand);
router.get('/start', authCaptain, errandController.startErrand);
router.post('/complete', authCaptain, errandController.completeErrand);
router.get('/my-deliveries', authCaptain, errandController.getMyErrands);

// Either party can cancel
router.post('/cancel', errandController.cancelErrand);

module.exports = router;
