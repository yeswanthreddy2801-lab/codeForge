# CodeForge Backend

The backend server for CodeForge, a competitive coding platform featuring a custom programming language (MyLang) and AI-powered English-to-Code translation.

## Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching**: Redis (via ioredis)
- **Code Execution**: Docker containers (C++, Java, Python, MyLang simulation)
- **Authentication**: JWT (Access + Refresh tokens) stored securely via HttpOnly cookies
- **File Storage**: Cloudinary (Avatar uploads)
- **AI Engine**: OpenAI GPT-4o-mini
- **Testing**: Jest + Supertest

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL
- Redis
- API Keys: OpenAI, Nodemailer, Cloudinary

### Environment Variables
Create a `.env` file in the root directory. Refer to the configuration instructions in `src/config/env.ts` for a complete list of required variables.

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the database and redis using Docker:
   ```bash
   docker-compose up -d
   ```

3. Run database migrations:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev
   ```

4. Seed the database with problems, users, contests, and lessons:
   ```bash
   npm run seed
   ```

5. Build the judge execution images:
   ```bash
   cd docker/judge
   docker build -t codeforge-judge-cpp -f Dockerfile.cpp .
   docker build -t codeforge-judge-java -f Dockerfile.java .
   docker build -t codeforge-judge-python -f Dockerfile.python .
   ```

### Running the App
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Features
- **Authentication**: Secure JWT with refresh token rotation.
- **Problems & Judge**: Submit code directly to an isolated Docker container which verifies execution against hidden test cases.
- **Leaderboard**: Highly optimized ranking engine built on Redis sorted sets, computed dynamically based on accuracy, difficulty, and streaks.
- **AI Translator**: Translate human english directly to MyLang code.
- **Contests**: Join and compete in live events with custom leaderboards.
- **Learn**: Self-paced lessons to master MyLang.
