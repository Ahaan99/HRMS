CHATBOT INTEGRATION — COMPLETE SUMMARY (for future reference)

Short Hindi summary:
- Yeh file chatbot se related saare updates ka poora saar (summary) hai — backend, frontend, database, endpoints, tests aur agle kadam. Isko future reference ke liye use karo.

1) Purpose
- Implement a single AI assistant experience across dashboards (HR, Admin, Client, Employee, Sales).
- Use Ollama locally for model responses and persist history in MySQL for audit and continuity.

2) High-level architecture
- Frontends call protected backend endpoints under `/api/automation/chatbot/*` to send messages and fetch session history.
- Backend builds prompts, calls Ollama (`OLLAMA_URL`), persists rows in `chatbot_conversations`, and returns AI replies.
- HR legacy chat continues to work via `/api/chat/*` and persists into `messages` table (left unchanged to avoid breakage).

3) Backend — exact changes
- Database:
  - Added `chatbot_conversations` table in `backen/config/initDb.js` with columns:
    - `id`, `user_type`, `user_id`, `session_id`, `message`, `response`, `is_ai_response`, `created_at`.

- Controllers / services:
  - `backen/controllers/automation/chatbotController.js`:
    - Central logic to generate AI responses.
    - `generateAIResponse()` builds prompt per `user_type`, calls Ollama, returns fallback if Ollama fails.
    - `sendMessage` endpoint inserts a row in `chatbot_conversations` and returns `{ session_id, response }`.
    - `getConversations` endpoint supports query by `session_id`, `user_type`, `page`, `limit`.

- Routes:
  - `backen/routes/automation/automation.routes.js`: mounted automation routes and protected via `protect()` middleware.

- Existing chat module preserved:
  - `backen/modules/chat/chat.routes.js` and `backen/modules/chat/chat.controller.js` retained for HR↔Client legacy flows. HR still uses `POST /api/chat/ai/ask` which persists into `messages` table.

4) Frontend — exact changes and new files
- Client
  - `client/src/pages/chat/ClientChatPage.jsx`: migrated to use automation endpoints (`/api/automation/chatbot/*`) and the app axios instance `client/src/services/api.js` so tokens attach automatically. The page now uses `session_id` model.

- Admin
  - `admin/src/pages/dashboard/AIChatHub.jsx`: updated to list automation sessions, open session histories, and send messages to `/api/automation/chatbot/message`.

- HR
  - HR chat UI not converted to automation endpoints — legacy `/api/chat/ai/ask` left intact to avoid breaking current behavior. (Optional migration later.)

- Employee (new)
  - `employee/src/pages/ChatPage.jsx`: new chat UI wired to automation endpoints.
  - `employee/src/routes/AppRoutes.jsx`: route added for `/chat`.

- Sales (new)
  - `Sales/src/pages/ChatPage.jsx`: new chat UI wired to automation endpoints.
  - `Sales/src/routes/AppRoutes.jsx`: route added for `/chat`.

5) Auth & axios instances
- Each app uses its axios wrapper to attach tokens from `localStorage` automatically:
  - `client/src/services/api.js`
  - `employee/src/api/axios.js`
  - `Sales/src/api/axios.js`
- Backend automation routes use `protect()` to validate JWT and set `req.user`.

6) Endpoints (useful list)
- `POST /api/automation/chatbot/message` — send a message (protected). Body: `{ message, session_id?, user_type? }`.
- `GET  /api/automation/chatbot/conversations` — fetch rows; query: `session_id`, `user_type`, `page`, `limit`.
- HR-specific endpoints still available under `/api/chat/*`, including `POST /api/chat/client/ai/ask` and `POST /api/chat/ai/ask` for HR.

7) Smoke tests & sample results (done locally)
- Super Admin test:
  - `POST /api/automation/chatbot/message` returned `session_id: sess_1780901027598_3qsyc6zq6`, `response: "Hi! How can I assist you today?"`.
- Client test:
  - Logged in as `testclient+1@example.com`, posted a message; returned `session_id: sess_1780901137694_austizdeo`, `response: "Thanks for your query. Please share more details so I can help with your request."`.

8) How to run locally (concise)
1. Ensure MySQL is running and `backen/.env` contains correct DB values.
2. (Optional) Run Ollama locally and set `OLLAMA_URL` and `OLLAMA_MODEL` in `backen/.env`. If Ollama is not reachable app uses typed fallback responses.
3. Start backend:
```bash
cd backen
npm install
npm run dev
```
4. Start frontends (each in separate terminal):
```bash
cd client && npm install && npm run dev
cd admin  && npm install && npm run dev
cd employee && npm install && npm run dev
cd Sales && npm install && npm run dev
```

9) Useful API examples
- Super Admin login:
```http
POST /api/super-admin/auth/login
{ "email": "admin@hrms.com", "password": "admin123" }
```
- Send automation message (protected):
```http
POST /api/automation/chatbot/message
Headers: Authorization: Bearer <token>
Body: { "message": "Hello", "session_id": "optional", "user_type": "CLIENT" }
```
- Fetch session history:
```http
GET /api/automation/chatbot/conversations?session_id=<session_id>
Headers: Authorization: Bearer <token>
```

10) Files changed (complete list)
- Backend:
  - `backen/config/initDb.js` (added `chatbot_conversations`)
  - `backen/controllers/automation/chatbotController.js` (new/modified)
  - `backen/routes/automation/automation.routes.js` (new/modified)
  - `backen/modules/chat/chat.routes.js` (existing, preserved)
  - `backen/modules/chat/chat.controller.js` (existing, preserved)
- Frontend:
  - `client/src/pages/chat/ClientChatPage.jsx` (migrated to automation)
  - `client/src/services/api.js` (axios wrapper)
  - `admin/src/pages/dashboard/AIChatHub.jsx` (migrated to automation)
  - `employee/src/pages/ChatPage.jsx` (new)
  - `employee/src/routes/AppRoutes.jsx` (route added)
  - `Sales/src/pages/ChatPage.jsx` (new)
  - `Sales/src/routes/AppRoutes.jsx` (route added)

11) Notes, caveats & next recommended steps
- Consolidation: HR messages are still saved to `messages` — consider migrating HR historic messages into `chatbot_conversations` for a single source of truth.
- Realtime: currently some frontends use polling; add socket.io integration for automation endpoints to push AI replies to clients.
- Prompt engineering: improve prompt templates in `chatbotController` for better domain-specific answers, tone control, and safety.
- Monitoring: add logs/metrics for Ollama failures and fallback usage so you can track model health.

12) Want me to do next?
- I can consolidate HR messages into `chatbot_conversations` (migration + UI updates), or
- Add socket.io real-time support for automation chatbot responses, or
- Run UI validation for Admin/Employee/Sales chat pages and record results.

— End of chatbot summary
