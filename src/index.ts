import { createApplication, Request, Response, NextFunction } from './app';
import { createRouter } from './router';
import { jsonBodyParser } from './middlewares/bodyParser';

const app = createApplication();

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(jsonBodyParser());

const userRouter = createRouter();

userRouter.get('/', async (req: Request, res: Response) => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  res.json({ message: 'List of users from router', query: req.query });
});

userRouter.get('/:id', async (req: Request, res: Response) => {
  console.log(req);
  const userId = req.params?.id;
  if (userId === 'error') {
    throw new Error('User not found in simulated DB');
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  res.json({ message: `User from router with ID: ${userId}` });
});

userRouter.post('/', async (req: Request, res: Response) => {
  const newUser = req.body;
  if (!newUser || !newUser.name) {
    throw new Error('User name is required.');
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  res.status(201).json({ message: 'User created from router', user: newUser });
});

app.use('/api/users', userRouter);

app.get('/', (_req: Request, res: Response) => {
  res.send('<h1>Welcome to Express Clone!</h1>');
});

app.get('/items/:id?', (req: Request, res: Response) => {
  const itemId = req.params?.id;
  if (itemId) {
    res.json({ message: `Fetching item ${itemId}` });
  } else {
    res.json({ message: 'Fetching all items' });
  }
});

app.get('/files/*', (req: Request, res: Response) => {
  res.json({ message: `Accessing file path: ${req.url}` });
});

app.use(
  '/async-error',
  async (_req: Request, _res: Response, _next: NextFunction) => {
    await new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Something went wrong asynchronously!')),
        100
      )
    );
  }
);

app.setErrorHandler(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Application Error:', err.message);
    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: 'An internal server error occurred.',
        details:
          process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    }
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
