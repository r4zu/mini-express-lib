import { createApplication, NextFunction, Request, Response } from './app';
import { createRouter } from './router';
import { jsonBodyParser } from './middlewares/bodyParser';

const app = createApplication();

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(jsonBodyParser());

const userRouter = createRouter();

userRouter.get('/users/:id', (req: Request, res: Response) => {
  const userId = req.params?.id;
  res.json({ message: `User with ID: ${userId}` });
});

userRouter.post('/users', (req: Request, res: Response) => {
  const newUser = req.body;
  res.status(201).json({ message: 'User created', user: newUser });
});

const { routes, middlewares } = userRouter.getRoutesAndMiddlewares();
routes.forEach((route) => {
  if (route.method === 'GET') app.get(route.path, ...route.handlers);
  if (route.method === 'POST') app.post(route.path, ...route.handlers);
});
middlewares.forEach((middleware) => app.use(middleware));

app.get('/', (_req: Request, res: Response) => {
  res.send('<h1>Welcome to My Express Clone!</h1>');
});

app.setErrorHandler(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Error:', err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: 'Somenthing went wrong!', details: err.message });
    }
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
