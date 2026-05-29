import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';

const router = Router();
const isAdmin = requireRoles('admin', 'super_admin');

router.use(authenticate, isAdmin);

router.get('/dashboard', adminController.getDashboardStats.bind(adminController));
router.get('/users', adminController.listUsers.bind(adminController));
router.get('/users/:id', adminController.getUser.bind(adminController));
router.patch('/users/:id/suspend', adminController.suspendUser.bind(adminController));
router.patch('/users/:id/activate', adminController.activateUser.bind(adminController));
router.get('/kyc', adminController.listKycRequests.bind(adminController));
router.patch('/kyc/:userId/approve', adminController.approveKyc.bind(adminController));
router.patch('/kyc/:userId/reject', adminController.rejectKyc.bind(adminController));
router.get('/rides', adminController.listRides.bind(adminController));
router.get('/errands', adminController.listErrands.bind(adminController));
router.get('/reports/revenue', adminController.getRevenueReport.bind(adminController));

export default router;
