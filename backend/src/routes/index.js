const express = require('express');
const authController = require('../controllers/authController');
const businessController = require('../controllers/businessController');
const serviceController = require('../controllers/serviceController');
const professionalController = require('../controllers/professionalController');
const appointmentController = require('../controllers/appointmentController');
const stripeController = require('../controllers/stripeController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Rotas de autenticação
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.me);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.put('/auth/change-password', authMiddleware, authController.changePassword);

// Rotas de negócios
router.post('/businesses', authMiddleware, businessController.create);
router.get('/businesses', authMiddleware, businessController.list);
router.get('/businesses/:id', authMiddleware, businessController.getById);
router.put('/businesses/:id', authMiddleware, businessController.update);
router.delete('/businesses/:id', authMiddleware, businessController.delete);
router.get('/businesses/:id/dashboard', authMiddleware, businessController.dashboard);

// Rotas de serviços
router.post('/services', authMiddleware, serviceController.create);
router.get('/services', authMiddleware, serviceController.list);
router.get('/services/:id', authMiddleware, serviceController.getById);
router.put('/services/:id', authMiddleware, serviceController.update);
router.delete('/services/:id', authMiddleware, serviceController.delete);

// Rotas de profissionais
router.post('/professionals', authMiddleware, professionalController.create);
router.get('/professionals', authMiddleware, professionalController.list);
router.get('/professionals/:id', authMiddleware, professionalController.getById);
router.put('/professionals/:id', authMiddleware, professionalController.update);
router.delete('/professionals/:id', authMiddleware, professionalController.delete);
router.post('/professionals/:id/availability', authMiddleware, professionalController.addAvailability);
router.delete('/professionals/:id/availability/:availabilityId', authMiddleware, professionalController.removeAvailability);
router.get('/professionals/:id/slots', authMiddleware, professionalController.getAvailableSlots);

// Rotas de agendamentos
router.post('/appointments', authMiddleware, appointmentController.create);
router.get('/appointments', authMiddleware, appointmentController.list);
router.get('/appointments/stats', authMiddleware, appointmentController.stats);
router.get('/appointments/:id', authMiddleware, appointmentController.getById);
router.put('/appointments/:id', authMiddleware, appointmentController.update);
router.delete('/appointments/:id', authMiddleware, appointmentController.cancel);
router.post('/appointments/:id/confirm', authMiddleware, appointmentController.confirm);
router.post('/appointments/:id/complete', authMiddleware, appointmentController.complete);

// Rotas de pagamento (Stripe)
router.post('/payments/create-checkout-session', authMiddleware, stripeController.createCheckoutSession);
router.post('/payments/webhook', express.raw({ type: 'application/json' }), stripeController.webhook);

module.exports = router;
