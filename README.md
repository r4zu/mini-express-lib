# Express Clone

---

## A Lightweight Web Framework for Node.js, Built with TypeScript

**Express Clone** is an educational project aimed at understanding the inner workings of web frameworks like Express. It provides a foundational set of features for building web applications, emphasizing **Clean Code** and **Clean Architecture** principles, all powered by **TypeScript**.

---

## Features

- **HTTP Server:** Built on Node.js's native `http` module.
- **Routing:** Define routes for different HTTP methods (GET, POST).
- **Middleware System:** Implement custom middleware functions to process requests before they reach route handlers (e.g., logging, body parsing, authentication).
- **Request & Response Enhancements:** Extended `Request` and `Response` objects with utilities like `req.params`, `req.query`, `res.json()`, `res.send()`, and `res.status()`.
- **Error Handling:** Dedicated middleware for centralized error management.
- **Router Module:** Create modular, reusable route handlers.

---

## Why This Project?

This project was developed to:

- Gain a deep understanding of how web frameworks operate "under the hood."
- Practice **TypeScript** for robust, type-safe code.
- Apply **Clean Code** principles for readability and maintainability.
- Implement **Clean Architecture** to promote separation of concerns, testability, and framework independence.

---

## Installation

To use this library in your project, install it via npm:

```bash
npm install mini-express-lib
# or
yarn add mini-express-lib
```

---

## Usage

Here's a quick example of how to use Express Clone to create a basic web server:

```typescript
// src/index.ts (Your application file)

import {
  createApplication,
  Request,
  Response,
  NextFunction,
} from 'my-express-clone';
import { jsonBodyParser } from 'my-express-clone/dist/middlewares/bodyParser'; // Example middleware, adjust path if needed
// Note: Depending on how you structured your publish, middlewares might be directly under 'my-express-clone/middlewares'

const app = createApplication();

// Global middleware for logging requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware to parse JSON request bodies
app.use(jsonBodyParser());

// Define a GET route for the homepage
app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Welcome to Express Clone!</h1>');
});

// Define a GET route with a URL parameter
app.get('/users/:id', (req: Request, res: Response) => {
  const userId = req.params?.id;
  res.json({ message: `Fetching user with ID: ${userId}`, query: req.query });
});

// Define a POST route to create a user
app.post('/users', (req: Request, res: Response) => {
  const newUser = req.body;
  res.status(201).json({ message: 'User created successfully', user: newUser });
});

// Error handling middleware (should be defined last)
app.setErrorHandler(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: 'Something went wrong!', details: err.message });
    }
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express Clone server running on http://localhost:${PORT}`);
});
```

### Running the Example

1.  Save the code above as `src/index.ts` in your project.
2.  Make sure you have `my-express-clone` installed.
3.  Compile your TypeScript:
    ```bash
    npx tsc
    ```
4.  Run the compiled JavaScript:
    ```bash
    node dist/index.js
    ```
5.  Open your browser or use a tool like Postman/cURL to test:
    - `GET http://localhost:3000/`
    - `GET http://localhost:3000/users/123?name=John`
    - `POST http://localhost:3000/users` with JSON body: `{"name": "Alice", "email": "alice@example.com"}`

---

## Project Structure (Clean Architecture)

The project follows a layered architecture to ensure modularity, maintainability, and separation of concerns:

```
my-express-clone/
├── src/
│   ├── app.ts                  # Core Application class (framework entry point)
│   ├── router.ts               # Router class for modular route definitions
│   ├── middlewares/            # Reusable middleware functions
│   │   └── bodyParser.ts
│   │   └── ... (e.g., logger.ts, errorHandler.ts)
│   │
│   ├── adapters/               # Adapters / Presentation Layer (your application's controllers, routes)
│   │   └── controllers/
│   │   └── routes/
│   │
│   ├── application/            # Application Layer (Use Cases / Application Services)
│   │   └── use-cases/
│   │   └── services/
│   │
│   ├── domain/                 # Domain Layer (Core Business Rules / Entities / Interfaces)
│   │   └── entities/
│   │   └── repositories/
│   │
│   └── infrastructure/         # Infrastructure Layer (Concrete implementations of repositories, external services)
│       └── persistence/
│       └── utils/
│
├── package.json
├── tsconfig.json
├── README.md
```

---

## Contributing

Contributions are welcome\! If you'd like to improve this project, feel free to fork the repository, make your changes, and submit a pull request.

---

## License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

---

Let me know if you'd like any adjustments or additional sections\!
