import {
  getChatsRequest,
  addMembersRequest,
  getMessagesRequest,
  updateGroupRequest,
  sendMessageRequest,
  removeMemberRequest,
  readMessagesRequest,
  promoteMemberRequest,
  createGroupChatRequest,
  deleteMessagesRequest,
  createPrivateChatRequest,
} from "@/modules/chats/chat.schema";
import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { ChatService } from "@/modules/chats/chat.service";
import { chatSuccessMessage } from "@/config/constant/chat.constant";

export class ChatController {
  static async createPrivateChat(c: Context) {
    const user = c.get("user");
    const request = createPrivateChatRequest.parse(await c.req.json());
    const response = await ChatService.createPrivateChat(c, user.userId, request);
    return responseOK(c, chatSuccessMessage.CREATE_PRIVATE_CHAT_SUCCESS, response);
  }

  static async createGroupChat(c: Context) {
    const user = c.get("user");
    const request = createGroupChatRequest.parse(await c.req.json());
    const response = await ChatService.createGroupChat(c, user.userId, request);
    return responseOK(c, chatSuccessMessage.CREATE_GROUP_CHAT_SUCCESS, response);
  }

  static async getMyChats(c: Context) {
    const user = c.get("user");
    const query = getChatsRequest.parse(c.req.query());
    const response = await ChatService.getMyChats(user.userId, query);
    return responseOK(c, chatSuccessMessage.GET_CHATS_SUCCESS, response.data, response.meta);
  }

  static async getChatById(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const response = await ChatService.getChatById(chatId, user.userId);
    return responseOK(c, chatSuccessMessage.GET_CHAT_SUCCESS, response);
  }

  static async getMessages(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const query = getMessagesRequest.parse(c.req.query());
    const response = await ChatService.getMessages(chatId, user.userId, query);
    return responseOK(c, chatSuccessMessage.GET_MESSAGES_SUCCESS, response.data, response.meta);
  }

  static async sendMessage(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const body = await c.req.parseBody({ all: true });
    const request = sendMessageRequest.parse({
      text: body.text,
      type: body.type,
      media: body?.media,
      replyToId: body.replyToId,
    });

    request.chatId = chatId;
    request.senderId = user.userId;
    const response = await ChatService.sendMessage(c, request);
    return responseOK(c, chatSuccessMessage.SEND_MESSAGE_SUCCESS, response);
  }

  static async readMessages(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = readMessagesRequest.parse(await c.req.json());
    const response = await ChatService.readMessages(chatId, user.userId, request);
    return responseOK(c, chatSuccessMessage.READ_MESSAGES_SUCCESS, response);
  }

  static async updateGroup(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = updateGroupRequest.parse(await c.req.json());
    const response = await ChatService.updateGroup(c, chatId, user.userId, request);
    return responseOK(c, chatSuccessMessage.UPDATE_GROUP_SUCCESS, response);
  }

  static async addMembers(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = addMembersRequest.parse(await c.req.json());
    const response = await ChatService.addMembers(c, chatId, user.userId, request);
    return responseOK(c, chatSuccessMessage.ADD_MEMBERS_SUCCESS, response);
  }

  static async removeMember(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = removeMemberRequest.parse(await c.req.json());
    await ChatService.removeMember(c, chatId, user.userId, request);
    return responseOK(c, chatSuccessMessage.REMOVE_MEMBER_SUCCESS);
  }

  static async leaveGroup(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    await ChatService.leaveGroup(chatId, user.userId);
    return responseOK(c, chatSuccessMessage.LEAVE_GROUP_SUCCESS);
  }

  static async promoteMember(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = promoteMemberRequest.parse(await c.req.json());
    await ChatService.promoteMember(c, chatId, user.userId, request);
    return responseOK(c, chatSuccessMessage.PROMOTE_MEMBER_SUCCESS);
  }

  static async demoteMember(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = promoteMemberRequest.parse(await c.req.json());
    await ChatService.demoteMember(c, chatId, user.userId, request);
    return responseOK(c, chatSuccessMessage.DEMOTE_MEMBER_SUCCESS);
  }

  static async deleteMessages(c: Context) {
    const user = c.get("user");
    const chatId = c.req.param("chatId");
    const request = deleteMessagesRequest.parse(await c.req.json());
    request.senderId = user.userId;
    request.chatId = chatId;
    await ChatService.deleteMessages(c, request);
    return responseOK(c, chatSuccessMessage.DELETE_MESSAGES_SUCCESS);
  }

  static async countUnreadMessages(c: Context) {
    const user = c.get("user");
    const response = await ChatService.countUnreadMessages(user.userId);
    return responseOK(c, chatSuccessMessage.COUNT_UNREAD_SUCCESS, response);
  }
}
