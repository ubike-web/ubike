import { Router } from 'express';
import { errandController } from '../controllers/ErrandController';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, requireRoles('customer'), errandController.request.bind(errandController));
router.get('/mine', authenticate, errandController.listMine.bind(errandController));
router.get('/:id', authenticate, errandController.getById.bind(errandController));
router.post('/:id/accept', authenticate, requireRoles('errands_rider'), errandController.accept.bind(errandController));
router.post('/:id/pickup', authenticate, requireRoles('errands_rider'), errandController.pickup.bind(errandController));
router.post('/:id/transit', authenticate, requireRoles('errands_rider'), errandController.transit.bind(errandController));
router.post('/:id/complete', authenticate, requireRoles('errands_rider'), errandController.complete.bind(errandController));
router.post('/:id/cancel', authenticate, errandController.cancel.bind(errandController));

export default router;
