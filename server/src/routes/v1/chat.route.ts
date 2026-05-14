import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { ChatController as ctrl } from "@/controllers/chat.controller";

const chat = new Hono();

chat.get("", protect, ctrl.getAllChats);
chat.get("/:chatId/messages", protect, ctrl.getChatMessages);
chat.post("/:chatId/messages", protect, ctrl.sendMessage);

export default chat;
