import { GetChatsRequest } from "@/models/chat.model";
import { ChatRepository } from "@/repositories/chat.repository";

export class ChatService {
  static async getChatsByUserId(query: GetChatsRequest) {}

  static async getMessagesByChatId() {}

  static async sendMessage() {}
}
