import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './config/logger';
import routes from './routes';
import { apiRateLimiter, speedLimiter, globalErrorHandler, notFoundHandler } from './middleware';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginEmbedderPolicy: false, hidePoweredBy: true }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error(`Blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}));
app.options('*', cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(compression());
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp({ whitelist: ['category','sort','status'] }));
app.use(morgan('dev'));
app.use('/api', speedLimiter);
app.use('/api', apiRateLimiter);
app.use('/api', routes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      try {
        const { cloudinary } = await import('./config/cloudinary');
        await cloudinary.api.ping();
        logger.info('✅ Cloudinary connected');
      } catch { logger.warn('⚠️  Cloudinary credentials invalid'); }
    } else {
      logger.warn('⚠️  Cloudinary not configured — image uploads disabled');
    }
    app.listen(env.PORT, () =>
      logger.info(`🚀 Tales with Sylvia API on port ${env.PORT} [${env.NODE_ENV}]`)
    );
  } catch (e) { logger.error('❌ Startup failed:', e); process.exit(1); }
}
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
bootstrap();
export default app;
