import { Context } from "hono";
import { pgsql } from "@/config/database/pgsql";
import { HTTPException } from "hono/http-exception";
import { FileService } from "@/modules/files/file.service";
import { NotificationType, Prisma } from "generated/prisma";
import { FollowUserRequest, GetFollowRequest } from "@/modules/users/user.schema";
import { FileRepository } from "@/modules/files/file.repository";
import { UserRepository } from "@/modules/users/user.repository";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { userAction, userErrorCode, userErrorMessage } from "@/config/constant/user.constant";

export class UserService {
  static async searchUsersByUsername(username: string, userId: string) {
    const users = await UserRepository.searchUsersByUsername(username, userId);
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isFollowing: user.followers && user.followers.length > 0,
      canFollow: user.id !== userId,
    }));
    return formattedUsers;
  }

  static async updateProfile(c: Context, userId: string, request: { name: string; bio?: string }) {
    return await pgsql.$transaction(async (tx) => {
      const updatedProfile = await UserRepository.updateProfile(userId, request, tx);
      const userLogs = {
        userId,
        action: userAction.UPDATE_PROFILE,
        metadata: {
          name: request.name,
          bio: request.bio,
        },
      };
      await UserRepository.createActivityLog(tx, userLogs);
      return updatedProfile;
    });
  }

  static async updateAvatar(c: Context, userId: string, avatar: File) {
    const fileRecord = await FileService.getFileRecordByTargetId(userId, "profile");

    await FileRepository.markFilesAsUnused(fileRecord ? [fileRecord.id] : []);

    const uploadedFile = await FileService.uploadSingleFile(c, userId, avatar, "profile", userId, true);

    return await pgsql.$transaction(async (tx) => {
      const updatedAvatar = await UserRepository.updateAvatar(userId, uploadedFile.url, tx);
      const userLogs = {
        userId,
        action: userAction.UPDATE_AVATAR,
        metadata: {
          fileId: uploadedFile.id,
          fileUrl: uploadedFile.url,
        },
      };
      await UserRepository.createActivityLog(tx, userLogs);

      return updatedAvatar;
    });
  }

  static async getProfileByUsername(username: string, currentUserId: string | null = null) {
    const user = await UserRepository.getProfileByUsername(username, currentUserId ?? "");

    if (!user) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
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
      isFollowing: currentUserId !== user.id && user.followers && user.followers.length > 0,
    };
  }

  static async followUser(c: Context, payload: FollowUserRequest) {
    const targetUser = await UserRepository.findById(payload.targetUserId);

    if (!targetUser) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
    }

    if (payload.userId === payload.targetUserId) {
      throw new HTTPException(400, { message: userErrorMessage.CANNOT_FOLLOW_SELF, cause: userErrorCode.CANNOT_FOLLOW_SELF });
    }

    try {
      await pgsql.$transaction(async (tx) => {
        await UserRepository.createFollow(tx, payload.userId!, payload.targetUserId);

        await NotificationRepository.createNotification(tx, {
          userId: payload.targetUserId,
          type: NotificationType.FOLLOW,
          title: "You have a new follower",
          description: `User ${c.var.user.username} started following you`,
          metadata: { followerId: payload.userId },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HTTPException(409, {
          message: userErrorMessage.ALREADY_FOLLOWING,
          cause: userErrorCode.ALREADY_FOLLOWING,
        });
      }
      throw error; // re-throw anything else
    }
  }

  static async unfollowUser(c: Context, payload: FollowUserRequest) {
    const targetUser = await UserRepository.findById(payload.targetUserId);

    if (!targetUser) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
    }

    if (payload.userId === payload.targetUserId) {
      throw new HTTPException(400, { message: userErrorMessage.CANNOT_FOLLOW_SELF, cause: userErrorCode.CANNOT_FOLLOW_SELF });
    }

    try {
      await UserRepository.deleteFollow(payload.userId!, payload.targetUserId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new HTTPException(409, {
          message: userErrorMessage.NOT_FOLLOWING,
          cause: userErrorCode.NOT_FOLLOWING,
        });
      }
      throw error;
    }
  }

  static async getFollowings(query: GetFollowRequest) {
    const targetUser = await UserRepository.findById(query.targetUserId!);

    if (!targetUser) {
      throw new HTTPException(404, {
        message: userErrorMessage.USER_NOT_FOUND,
        cause: userErrorCode.USER_NOT_FOUND,
      });
    }

    const { results, totalItems } = await UserRepository.getFollowings(query);
    const data = results.map((f) => ({
      id: f.id,
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      isFollowing: f.followers.length > 0,
      canFollow: f.id !== query.userId,
    }));
    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / Number(query.limit)),
        currentPage: Number(query.page),
      },
    };
  }

  static async getFollowers(query: GetFollowRequest) {
    const targetUser = await UserRepository.findById(query.targetUserId!);

    if (!targetUser) {
      throw new HTTPException(404, {
        message: userErrorMessage.USER_NOT_FOUND,
        cause: userErrorCode.USER_NOT_FOUND,
      });
    }

    const { results, totalItems } = await UserRepository.getFollowers(query);

    const data = results.map((f) => ({
      id: f.id,
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      isFollowing: f.followers.length > 0,
      canFollow: f.id !== query.userId,
    }));

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / Number(query.limit)),
        currentPage: Number(query.page),
      },
    };
  }
}
