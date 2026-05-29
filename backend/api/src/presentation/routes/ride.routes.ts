import { Router } from 'express';
import { rideController } from '../controllers/RideController';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/estimate', rideController.estimate.bind(rideController));
router.post('/', authenticate, requireRoles('customer'), rideController.request.bind(rideController));
router.get('/mine', authenticate, rideController.listMine.bind(rideController));
router.get('/:id', authenticate, rideController.getById.bind(rideController));
router.post('/:id/accept', authenticate, requireRoles('passenger_rider'), rideController.accept.bind(rideController));
router.post('/:id/arrived', authenticate, requireRoles('passenger_rider'), rideController.arrived.bind(rideController));
router.post('/:id/start', authenticate, requireRoles('passenger_rider'), rideController.start.bind(rideController));
router.post('/:id/complete', authenticate, requireRoles('passenger_rider'), rideController.complete.bind(rideController));
router.post('/:id/cancel', authenticate, rideController.cancel.bind(rideController));
router.post('/:id/fare/propose', authenticate, requireRoles('passenger_rider'), rideController.proposeFare.bind(rideController));
router.post('/:id/fare/respond', authenticate, requireRoles('customer'), rideController.respondFare.bind(rideController));
router.post('/:id/rate', authenticate, rideController.rate.bind(rideController));

export default router;
