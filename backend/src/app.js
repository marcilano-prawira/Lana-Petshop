import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import ErrorMiddleware from './middlewares/ErrorMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Lana PetShop Alhamdulillah berjalan' });
});

app.use('/api', routes);

app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.handle);

export default app;
