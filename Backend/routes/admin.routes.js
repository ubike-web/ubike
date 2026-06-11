const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authAdmin } = require('../middlewares/admin.middleware');
const { body } = require('express-validator');

router.post('/setup', adminController.adminSetup);

router.post('/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  adminController.adminLogin
);

router.get('/stats', authAdmin, adminController.getDashboardStats);
router.get('/captains', authAdmin, adminController.listCaptains);
router.get('/captain/:id', authAdmin, adminController.getCaptainDetail);
router.post('/captain/:id/approve', authAdmin, adminController.approveCaptain);
router.post('/captain/:id/reject', authAdmin, adminController.rejectCaptain);

module.exports = router;
