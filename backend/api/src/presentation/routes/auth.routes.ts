import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/otp/send', authController.sendOtp.bind(authController));
router.post('/otp/verify', authController.verifyOtp.bind(authController));
router.post('/register', authController.registerEmail.bind(authController));
router.post('/login', authController.loginEmail.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
