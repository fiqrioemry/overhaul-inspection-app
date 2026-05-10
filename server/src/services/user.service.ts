import { Context } from "hono";
import { FileService } from "./file.service";
import { HTTPException } from "hono/http-exception";
import errorCodes from "@/config/constant/errorCode";
import errorMessages from "@/config/constant/errorMessage";
import { UserRepository } from "@/repositories/user.repository";
import { FileRepository } from "@/repositories/file.repository";

export class UserService {
  static async searchUsersByUsername(username: string) {
    const users = await UserRepository.searchUsersByUsername(username);
    return users;
  }

  static async updateProfile(c: Context, userId: string, request: { name: string; bio?: string }) {
    const updatedProfile = await UserRepository.updateProfile(userId, request);
    return updatedProfile;
  }

  static async updateAvatar(c: Context, userId: string, avatar: File) {
    const uploadedFile = await FileService.uploadSingleFile(c, userId, avatar, "profile", userId, true);

    const fileRecord = await FileService.getFileRecordByTargetId(userId, "profile");

    await FileRepository.markFilesAsUnused(fileRecord ? [fileRecord.id] : []);

    const updateAvatar = await UserRepository.updateAvatar(userId, uploadedFile.url);

    return updateAvatar;
  }

  static async getProfileByUsername(username: string, currentUserId: string | null = null) {
    const user = await UserRepository.getProfileByUsername(username);

    if (!user) {
      throw new HTTPException(404, { message: errorMessages.userNotFound, cause: errorCodes.userNotFound });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      lastLogin: user.lastLogin,
      joinedAt: user.createdAt,
      isPublic: user.isPublic,
      isOwner: currentUserId === user.id,
      followers: user._count?.followers,
      followings: user._count?.following,
      posts: user._count?.posts,
    };
  }
}
