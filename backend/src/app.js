const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const setupPassport = require('./config/passport');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const restaurantRoutes = require('./routes/restaurant');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const customerRoutes = require('./routes/customer');
const tableRoutes = require('./routes/table');
const notificationRoutes = require('./routes/notification');
const whatsappRoutes = require('./routes/whatsapp');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// ─── Trust Proxy (for ngrok and load balancers) ──────────
app.set('trust proxy', 1);

// ─── Security Middleware ────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(mongoSanitize());
app.use(hpp());

// ─── Body Parsers ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Passport ───────────────────────────────────────────
setupPassport();
app.use(passport.initialize());

// ─── Rate Limiting ──────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Request Logging ────────────────────────────────────
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// ─── API Documentation ─────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Restaurant SaaS API Docs',
}));

// ─── Health Check ───────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// ─── API Routes ─────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/restaurant/menu', menuRoutes);
app.use('/api/v1/restaurant/orders', orderRoutes);
app.use('/api/v1/restaurant/customers', customerRoutes);
app.use('/api/v1/restaurant/tables', tableRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/restaurant/analytics', analyticsRoutes);

// ─── 404 Handler ────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ─── Global Error Handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
