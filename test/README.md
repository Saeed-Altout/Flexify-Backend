# Test Directory (`test/`)

This directory contains end-to-end (E2E) tests for the application.

## 📁 Structure

```
test/
├── app.e2e-spec.ts   # Main E2E test file
└── jest-e2e.json     # Jest configuration for E2E tests
```

## 🎯 Purpose

E2E tests provide:

- **Integration Testing**: Test complete request/response cycles
- **API Validation**: Verify API endpoints work correctly
- **Database Testing**: Test database interactions
- **Authentication Testing**: Test protected routes
- **Regression Prevention**: Catch breaking changes

## 💡 How It Works

### E2E Test Structure

```typescript
// app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });
});
```

### Jest Configuration (`jest-e2e.json`)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## 📝 Writing E2E Tests

### Basic GET Request

```typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```

### POST Request with Body

```typescript
it('/users (POST)', () => {
  return request(app.getHttpServer())
    .post('/api/users')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
    .expect(201)
    .expect((res) => {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('test@example.com');
    });
});
```

### Authenticated Request

```typescript
it('/users/profile (GET)', async () => {
  // First, login to get token
  const loginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'password123',
    });

  const token = loginResponse.body.data.accessToken;

  // Use token for protected route
  return request(app.getHttpServer())
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});
```

### Testing Validation

```typescript
it('/users (POST) - should fail validation', () => {
  return request(app.getHttpServer())
    .post('/api/users')
    .send({
      name: 'A', // Too short
      email: 'invalid-email', // Invalid email
    })
    .expect(400)
    .expect((res) => {
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.message)).toBe(true);
    });
});
```

### Database Setup/Teardown

```typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = app.get(DataSource);

    // Run migrations
    await dataSource.runMigrations();

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await dataSource.dropDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Seed test data before each test
    await seedTestData(dataSource);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData(dataSource);
  });
});
```

## 🚀 Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with coverage
npm run test:e2e -- --coverage

# Run specific test file
npm run test:e2e -- app.e2e-spec.ts

# Run in watch mode
npm run test:e2e -- --watch
```

## 🚀 Best Practices

- **Isolation**: Each test should be independent
- **Cleanup**: Clean up test data after tests
- **Test Database**: Use separate test database
- **Descriptive Names**: Use clear test descriptions
- **Arrange-Act-Assert**: Follow AAA pattern
- **Mock External Services**: Mock external APIs/services
- **Performance**: Keep tests fast

## 📋 Test Organization

```
test/
├── app.e2e-spec.ts
├── auth/
│   ├── login.e2e-spec.ts
│   └── register.e2e-spec.ts
├── users/
│   └── users.e2e-spec.ts
└── common/
    └── helpers.ts  # Test helpers and utilities
```
