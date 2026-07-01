import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
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
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const distPath = path.resolve(__dirname, '../../dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

initLive(server);
initRAG();

server.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = Object.values(require('os').networkInterfaces()).flat();
  const ip = networkInterfaces.find((i: any) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  console.log(`[AOS Server] Running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${ip}:${PORT}`);
});
