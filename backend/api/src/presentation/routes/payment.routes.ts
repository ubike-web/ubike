import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/webhook/paystack', paymentController.paystackWebhook.bind(paymentController));
router.post('/rides/initialize', authenticate, requireRoles('customer'), paymentController.initRidePayment.bind(paymentController));
router.post('/errands/initialize', authenticate, requireRoles('customer'), paymentController.initErrandPayment.bind(paymentController));
router.get('/verify/:reference', authenticate, paymentController.verifyPayment.bind(paymentController));
router.get('/wallet', authenticate, paymentController.getWallet.bind(paymentController));
router.get('/transactions', authenticate, paymentController.getTransactions.bind(paymentController));

export default router;
