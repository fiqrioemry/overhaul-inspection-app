import { Context } from "hono";
import { FileService } from "./file.service";
import { UserRepository } from "@/repositories/user.repository";
import { HTTPException } from "hono/http-exception";
import { error } from "node:console";
import errorMessages from "@/config/constant/errorMessage";
import errorCodes from "@/config/constant/errorCode";

export class UserService {
  static async searchUsersByUsername(username: string) {
    const users = await UserRepository.searchUsersByUsername(username);
    return users;
  }

  static async getProfile(c: Context, userId: string) {
    const user = await UserRepository.getProfileById(userId);

    if (!user) {
      throw new HTTPException(404, { message: errorMessages.userNotFound, cause: errorCodes.userNotFound });
    }
    return user;
  }

  static async updateProfile(c: Context, userId: string, request: { name: string; bio?: string }) {
    const updatedProfile = await UserRepository.updateProfile(userId, request);
    return updatedProfile;
  }

  static async updateAvatar(c: Context, userId: string, avatar: File) {
    const uploadedFile = await FileService.uploadSingleFile(c, userId, avatar, "avatar");
    const updateAvatar = await UserRepository.updateAvatar(userId, uploadedFile.url);
    return updateAvatar;
  }

  static async getProfileByUsername(username: string) {
    const user = await UserRepository.getProfileByUsername(username);

    if (!user) {
      throw new HTTPException(404, { message: errorMessages.userNotFound, cause: errorCodes.userNotFound });
    }

    return user;
  }
}
