import { createApplication, NextFunction, Request, Response } from './app';
import { jsonBodyParser } from './middlewares/bodyParser';

const app = createApplication();

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(jsonBodyParser());

app.get('/', (_req: Request, res: Response) => {
  res.send('<h1>Welcome to My Express Clone!</h1>');
});

app.get('/users/:id', async (req: Request, res: Response) => {
  const userId = req.params?.id;
  if (userId === 'error') {
    throw new Error('User not found in simulated DB');
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  res.json({ message: `Fetching user with ID: ${userId}`, query: req.query });
});

app.post('/users', async (req: Request, res: Response) => {
  const newUser = req.body;
  if (!newUser || !newUser.name) {
    throw new Error('User name is required.');
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  res.status(201).json({ message: 'User created successfully', user: newUser });
});

app.use(
  '/async-error',
  async (req: Request, res: Response, next: NextFunction) => {
    await new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Something went wrong asynchronously!')),
        100
      )
    );
    res.send('This should not be sent');
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
