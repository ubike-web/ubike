import { Router } from 'express';
import { uploadController, uploadSingleAvatar, uploadKycDoc } from '../controllers/UploadController';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

// Profile photo — any authenticated user
router.post('/avatar', authenticate, uploadSingleAvatar, uploadController.uploadAvatar.bind(uploadController));
router.delete('/avatar', authenticate, uploadController.deleteAvatar.bind(uploadController));

// KYC documents — riders only
router.post('/kyc', authenticate, requireRoles('passenger_rider', 'errands_rider'), uploadKycDoc, uploadController.uploadKycDocument.bind(uploadController));

// Delivery proof — errands riders only
router.post('/delivery-proof', authenticate, requireRoles('errands_rider'), uploadSingleAvatar, uploadController.uploadDeliveryProof.bind(uploadController));

export default router;
