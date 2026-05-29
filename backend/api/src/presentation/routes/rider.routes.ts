import { Router } from 'express';
import { riderController } from '../controllers/RiderController';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

const isRider = requireRoles('passenger_rider', 'errands_rider');

router.get('/profile', authenticate, isRider, riderController.getProfile.bind(riderController));
router.patch('/availability', authenticate, isRider, riderController.toggleOnline.bind(riderController));
router.post('/location', authenticate, isRider, riderController.updateLocation.bind(riderController));
router.post('/kyc', authenticate, isRider, riderController.submitKyc.bind(riderController));
router.get('/earnings', authenticate, isRider, riderController.getEarnings.bind(riderController));
router.get('/stats', authenticate, isRider, riderController.getStats.bind(riderController));
router.get('/call-token/:rideId', authenticate, isRider, riderController.getCallToken.bind(riderController));

export default router;
