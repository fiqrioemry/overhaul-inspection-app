import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { HTTPException } from "hono/http-exception";
import { FileService } from "@/modules/files/file.service";
import { UserRepository } from "@/modules/users/user.repository";
import { FileRepository } from "@/modules/files/file.repository";
import { FollowStatus, NotificationType, Prisma } from "generated/prisma";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { userAction, userErrorCode, userErrorMessage } from "@/config/constant/user.constant";
import { followingResponse, followRequestResponse, metaResponse, profileResponse, userSearchResponse } from "@/modules/users/user.types";
import { FollowUserRequest, GetFollowRequest, GetFollowRequestsQuery, RespondFollowRequest, UpdatePrivacyRequest, UpdateProfileRequest } from "@/modules/users/user.schema";

export class UserService {
  static async searchUsersByUsername(username: string, userId: string): Promise<userSearchResponse[]> {
    const users = await UserRepository.searchUsersByUsername(username, userId);
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isFollowing: user.followers && user.followers.length > 0,
      followStatus: user.followers && user.followers.length > 0 ? "ACCEPTED" : ("NONE" as FollowStatus),
      canFollow: user.id !== userId,
    }));
    return formattedUsers;
  }

  static async updateProfile(c: Context, payload: UpdateProfileRequest) {
    const { userId, ...request } = payload;
    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.updateProfile(userId!, request, tx);
      const userLogs = {
        userId: userId!,
        action: userAction.UPDATE_PROFILE,
        metadata: {
          name: request.name,
          bio: request.bio,
          gender: request.gender,
        },
      };
      await UserRepository.createActivityLog(tx, userLogs);
    });
  }

  static async updateAvatar(c: Context, userId: string, avatar: File) {
    const fileRecord = await FileService.getFileRecordByTargetId(userId, "profile");

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const fileDataRecord = await FileService.generateFileRecord(avatar, "profile");

      if (fileRecord) {
        await FileRepository.markFilesAsUnused(tx, [fileRecord.id]);
      }

      await FileService.uploadFileToStorage(c, fileDataRecord);

      fileDataRecord.isUsed = true;
      const uploadedFile = await FileService.saveRecordToDatabase(fileDataRecord, tx);

      await UserRepository.updateAvatar(userId, fileDataRecord.url!, tx);

      const userLogs = {
        userId,
        action: userAction.UPDATE_AVATAR,
        metadata: {
          fileId: uploadedFile.id,
          fileUrl: uploadedFile.url,
        },
      };
      await UserRepository.createActivityLog(tx, userLogs);
    });
  }

  static async getProfileByUsername(username: string, currentUserId: string | null = null): Promise<profileResponse> {
    const user = await UserRepository.getProfileByUsername(username, currentUserId ?? "");

    if (!user) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
    }

    let followStatus: FollowStatus = "NONE";
    if (currentUserId && currentUserId !== user.id) {
      const record = await UserRepository.findFollow(currentUserId, user.id);
      if (record) {
        followStatus = record.status === "ACCEPTED" ? "ACCEPTED" : "PENDING";
      }
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
      totalPosts: user._count?.posts ?? 0,
      totalFollowers: user._count?.followers ?? 0,
      totalFollowings: user._count?.following ?? 0,
      followStatus,
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

    // Cek apakah current user sudah punya record follow ke target
    const existing = await UserRepository.findFollow(payload.userId!, payload.targetUserId);
    if (existing) {
      const message = existing.status === "PENDING" ? userErrorMessage.FOLLOW_REQUEST_ALREADY_SENT : userErrorMessage.ALREADY_FOLLOWING;
      const cause = existing.status === "PENDING" ? userErrorCode.FOLLOW_REQUEST_ALREADY_SENT : userErrorCode.ALREADY_FOLLOWING;
      throw new HTTPException(409, { message, cause });
    }

    const reverseRequest = await UserRepository.findFollow(payload.targetUserId, payload.userId!);
    if (reverseRequest && reverseRequest.status === "PENDING") {
      await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
        await UserRepository.acceptFollow(tx, payload.targetUserId, payload.userId!);

        await NotificationRepository.createNotification(tx, {
          userId: payload.targetUserId,
          type: NotificationType.FOLLOW,
          title: "Follow request accepted",
          description: `${c.var.user.username} accepted your follow request`,
          metadata: { followerId: payload.userId },
        });

        await UserRepository.createFollow(tx, payload.userId!, payload.targetUserId, "ACCEPTED");

        await NotificationRepository.createNotification(tx, {
          userId: payload.targetUserId,
          type: NotificationType.FOLLOW,
          title: "New follower",
          description: `${c.var.user.username} started following you`,
          metadata: { followerId: payload.userId },
        });
      });

      return { requested: false, followStatus: "ACCEPTED" as FollowStatus };
    }

    const isPublic = await UserRepository.isPublicAccount(payload.targetUserId);
    const followStatus = isPublic ? "ACCEPTED" : "PENDING";

    await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.createFollow(tx, payload.userId!, payload.targetUserId, followStatus);

      if (isPublic) {
        await NotificationRepository.createNotification(tx, {
          userId: payload.targetUserId,
          type: NotificationType.FOLLOW,
          title: "New follower",
          description: `${c.var.user.username} started following you`,
          metadata: { followerId: payload.userId },
        });
      } else {
        await NotificationRepository.createNotification(tx, {
          userId: payload.targetUserId,
          type: NotificationType.REQUEST,
          title: "New follow request",
          description: `${c.var.user.username} wants to follow you`,
          metadata: { followerId: payload.userId },
        });
      }
    });

    return { requested: !isPublic, followStatus };
  }

  static async unfollowUser(c: Context, payload: FollowUserRequest) {
    const targetUser = await UserRepository.findById(payload.targetUserId);

    if (!targetUser) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
    }
    if (payload.userId === payload.targetUserId) {
      throw new HTTPException(400, { message: userErrorMessage.CANNOT_FOLLOW_SELF, cause: userErrorCode.CANNOT_FOLLOW_SELF });
    }

    const existing = await UserRepository.findFollow(payload.userId!, payload.targetUserId);
    if (!existing) {
      throw new HTTPException(409, { message: userErrorMessage.NOT_FOLLOWING, cause: userErrorCode.NOT_FOLLOWING });
    }

    await UserRepository.deleteFollow(payload.userId!, payload.targetUserId);

    return { wasPending: existing.status === "PENDING" };
  }

  static async getFollowings(query: GetFollowRequest): Promise<{ data: followingResponse[]; meta: metaResponse }> {
    const targetUser = await UserRepository.findById(query.targetUserId!);
    if (!targetUser) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
    }

    const { results, totalItems } = await UserRepository.getFollowings(query);
    const data = results.map((f) => ({
      id: f.id,
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      followStatus: (f.followers.length > 0 ? "ACCEPTED" : "NONE") as FollowStatus,
    }));

    return {
      data,
      meta: {
        pagination: {
          page: Number(query.page!),
          limit: Number(query.limit!),
          totalItems,
          totalPages: Math.ceil(totalItems / Number(query.limit)),
        },
      },
    };
  }

  // UPDATED getFollowers — same mapper change
  static async getFollowers(query: GetFollowRequest): Promise<{ data: followingResponse[]; meta: metaResponse }> {
    const targetUser = await UserRepository.findById(query.targetUserId!);
    if (!targetUser) {
      throw new HTTPException(404, { message: userErrorMessage.USER_NOT_FOUND, cause: userErrorCode.USER_NOT_FOUND });
    }

    const { results, totalItems } = await UserRepository.getFollowers(query);
    const data = results.map((f) => ({
      id: f.id,
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      followStatus: (f.followers.length > 0 ? "ACCEPTED" : "NONE") as FollowStatus,
    }));

    return {
      data,
      meta: {
        pagination: {
          page: Number(query.page),
          limit: Number(query.limit!),
          totalItems,
          totalPages: Math.ceil(totalItems / Number(query.limit)),
        },
      },
    };
  }

  static async updatePrivacy(c: Context, request: UpdatePrivacyRequest): Promise<void> {
    // check user exist
    const user = await UserRepository.findById(request.userId!);

    if (!user) {
      throw new HTTPException(404, {
        message: userErrorMessage.USER_NOT_FOUND,
        cause: userErrorCode.USER_NOT_FOUND,
      });
    }

    await UserRepository.updatePrivacy(request.userId!, request.isPublic!);
  }

  static async acceptFollowRequest(c: Context, payload: RespondFollowRequest): Promise<void> {
    const existing = await UserRepository.findFollow(payload.followerId, payload.userId!);

    if (!existing || existing.status !== "PENDING") {
      throw new HTTPException(404, {
        message: userErrorMessage.FOLLOW_REQUEST_NOT_FOUND,
        cause: userErrorCode.FOLLOW_REQUEST_NOT_FOUND,
      });
    }

    await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.acceptFollow(tx, payload.followerId, payload.userId!);

      await NotificationRepository.createNotification(tx, {
        userId: payload.followerId,
        type: NotificationType.FOLLOW,
        title: "Follow request accepted",
        description: `${c.var.user.username} accepted your follow request`,
        metadata: { userId: payload.userId },
      });
    });
  }

  static async rejectFollowRequest(c: Context, payload: RespondFollowRequest): Promise<void> {
    const existing = await UserRepository.findFollow(payload.followerId, payload.userId!);

    if (!existing || existing.status !== "PENDING") {
      throw new HTTPException(404, {
        message: userErrorMessage.FOLLOW_REQUEST_NOT_FOUND,
        cause: userErrorCode.FOLLOW_REQUEST_NOT_FOUND,
      });
    }

    // Simply delete the record — no notification needed (Instagram behaviour)
    await UserRepository.deleteFollow(payload.followerId, payload.userId!);
  }

  static async getFollowRequests(query: GetFollowRequestsQuery): Promise<{ data: followRequestResponse[]; meta: metaResponse }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    const { results, totalItems } = await UserRepository.getPendingFollowRequests(query.userId!, page, limit);

    return {
      data: results.map((r) => ({
        id: r.id,
        follower: r.follower,
        createdAt: r.createdAt,
        name: r.follower.name,
        username: r.follower.username,
        avatar: r.follower.avatar,
      })),
      meta: {
        pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
      },
    };
  }
}
