import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { chatLimit } from "@/config/constant/chat.constant";
import { limitter } from "@/middlewares/limitter.middleware";
import { ChatController as ctrl } from "@/modules/chats/chat.controller";

const chat = new Hono();

// chat list and creation
chat.get("", protect, limitter(chatLimit.GET_CHATS), ctrl.getMyChats);
chat.post("/private", protect, limitter(chatLimit.CREATE_CHAT), ctrl.createPrivateChat);
chat.post("/group", protect, limitter(chatLimit.CREATE_CHAT), ctrl.createGroupChat);

// private / single chat
chat.get("/:chatId", protect, limitter(chatLimit.GET_CHAT), ctrl.getChatById);

// messages
chat.get("/:chatId/messages", protect, limitter(chatLimit.GET_MESSAGES), ctrl.getMessages);
chat.post("/:chatId/messages", protect, limitter(chatLimit.SEND_MESSAGE), ctrl.sendMessage);
chat.patch("/:chatId/messages/read", protect, limitter(chatLimit.READ_MESSAGES), ctrl.readMessages);

// group management
chat.patch("/:chatId/group", protect, limitter(chatLimit.UPDATE_GROUP), ctrl.updateGroup);
chat.post("/:chatId/members", protect, limitter(chatLimit.ADD_MEMBERS), ctrl.addMembers);
chat.delete("/:chatId/members", protect, limitter(chatLimit.REMOVE_MEMBER), ctrl.removeMember);
chat.delete("/:chatId/leave", protect, limitter(chatLimit.LEAVE_GROUP), ctrl.leaveGroup);
chat.patch("/:chatId/members/promote", protect, limitter(chatLimit.PROMOTE_DEMOTE), ctrl.promoteMember);
chat.patch("/:chatId/members/demote", protect, limitter(chatLimit.PROMOTE_DEMOTE), ctrl.demoteMember);

export default chat;
