# EssaiAI - Backend

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Folder Structure](#folder-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Running the Project](#running-the-project)
8. [Frontend Integration](#frontend-integration)
9. [Deployment](#deployment)
10. [Contributing](#contributing)
11. [License](#license)

## Project Overview
EssaiAI is a stateless, privacy-first academic writing assistant. This backend API server acts as the brains of the operation. It receives essay text and configuration parameters from the client, dynamically builds highly tailored evaluation prompts based on the document type, and utilizes a Strategy Pattern to route the request to various Large Language Model (LLM) providers like Gemini, OpenAI, or Anthropic. It guarantees zero logs and zero database storage.

## Tech Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Logging:** `nestjs-pino`
- **API Docs:** Swagger
- **LLM SDKs:** `@google/generative-ai`, `openai`, `@anthropic-ai/sdk`

## Architecture Overview
The backend leverages a purely stateless API design:
1. **Controller & Validation:** Inbound requests hit the `ReviewerController`, where NestJS Global Pipes and DTOs heavily validate the payload.
2. **Prompt Builder:** A dedicated factory that injects specific grading constraints (Grammar, Flow, Academic Tone, Structure) based on the user's selected Document Type.
3. **Strategy Pattern:** The `StrategyFactory` instantiates the correct API provider class (`GeminiStrategy`, `OpenAIStrategy`, etc.) at runtime using the user's provided API keys (or server fallbacks) and streams the response securely.

## Folder Structure
```text
backend/
├── src/
│   ├── common/            # DTOs, interfaces, and shared utilities
│   ├── reviewer/          # Core module containing controllers, services, and strategies
│   ├── app.module.ts      # Root NestJS module
│   └── main.ts            # Entry point, Swagger config, and CORS setup
├── .env.example           # Example environment variables
├── package.json           # Backend dependencies
└── README.md              # This documentation
```

## Getting Started
### Prerequisites
- Node.js (v18.x or v20.x recommended)
- npm

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/essai-ai-backend.git
cd essai-ai-backend
npm install
```

## Environment Variables
The API requires standard configuration for ports and CORS. Copy the `.env.example` file to create your own configuration:
```bash
cp .env.example .env
```
Inside `.env`, ensure you configure your variables:
```env
PORT=3001
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: Setting `CLIENT_URL` correctly is vital for preventing CORS issues when communicating with your frontend).*

## Running the Project
Start the NestJS development server:
```bash
# development mode
npm run start

# watch mode (recommended for local development)
npm run start:dev
```
The API will be available at [http://localhost:3001](http://localhost:3001).
You can interact with the Swagger API Documentation directly at [http://localhost:3001/api-docs](http://localhost:3001/api-docs).

## Frontend Integration
This API is designed to be consumed by the **EssaiAI Frontend** (a Next.js application). Ensure your frontend's environment variable (`NEXT_PUBLIC_API_BASE_URL`) is pointed to this server's host and port.

## Deployment
Since NestJS is a long-running Node.js process, it is best deployed to dedicated Node.js hosting environments rather than Serverless functions.
Recommended platforms include:
- **Render**
- **Railway**
- **Fly.io**
- **Heroku**

When deploying, ensure your production `CLIENT_URL` is set to your live frontend domain to maintain secure CORS boundaries.

## Contributing
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-backend-logic`).
3. Commit your changes (`git commit -m 'Add some amazing backend logic'`).
4. Push to the branch (`git push origin feature/amazing-backend-logic`).
5. Open a Pull Request.

## License
Distributed under the MIT License.
