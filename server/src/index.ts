import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { productRouter } from './routes/products';
import { orderRouter } from './routes/orders';
import { errorHandler } from './middleware/errorHandler';
import { initLive } from './services/live';
import { initRAG } from './services/rag';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

app.get('/', (_req, res) => {
  res.json({ name: 'AOS API Server', version: '1.0.0', status: 'running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

initLive(server);
initRAG();

server.listen(PORT, () => {
  console.log(`[AOS Server] Running on http://localhost:${PORT}`);
});
