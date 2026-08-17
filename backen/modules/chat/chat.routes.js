import express from "express";

import {
  getAllHR,
  getAllClients,
  startConversation,
  getMessages,
  sendMessage,
  getClientConversations,
  getHRConversations,
  askAI,
} from "./chat.controller.js";

import { hrAuthMiddleware } from "../../middleware/hrAuth.middleware.js";
import { clientAuthMiddleware } from "../../middleware/clientAuth.middleware.js";
import {
  internalChatAuth,
  getInternalMessages,
  sendInternalMessage,
} from "./internalChat.controller.js";

const router = express.Router();

/* INTERNAL CHAT (HR / IT / SUPERADMIN) */

router.get("/internal/:room", internalChatAuth, getInternalMessages);
router.post("/internal/send", internalChatAuth, sendInternalMessage);

/* CLIENT DIRECTORY */

router.get("/client/hrs", clientAuthMiddleware, getAllHR);

/* HR DIRECTORY */

router.get("/hr/clients", hrAuthMiddleware, getAllClients);


/* EXISTING CONVERSATIONS */

router.get(
  "/client/conversations",
  clientAuthMiddleware,
  getClientConversations
);

router.get(
  "/hr/conversations",
  hrAuthMiddleware,
  getHRConversations
);


/* CHAT */

router.post("/client/start", clientAuthMiddleware, startConversation);

router.post("/hr/start", hrAuthMiddleware, startConversation);

router.get("/messages/:conversationId", getMessages);

router.post("/send", hrAuthMiddleware, sendMessage);

router.post("/client/send", clientAuthMiddleware, sendMessage);
router.post("/client/ai/ask", clientAuthMiddleware, askAI);
router.post("/ai/ask", hrAuthMiddleware, askAI);

export default router;
