// Schema & path definitions untuk module notifications
// Diimport dan di-merge ke spec di docs.route.ts

export const notificationSchemas = {
  // ── Sub-schemas ──────────────────────────────────────────────
  NotificationItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_notif_123" },
      title: { type: "string", example: "New Like on Your Post" },
      description: { type: "string", nullable: true, example: "@johndoe liked your post: My first post" },
      type: {
        type: "string",
        enum: ["LIKE", "COMMENT", "FOLLOW", "REPLY", "MENTION"],
        example: "LIKE",
      },
      metadata: {
        type: "object",
        nullable: true,
        description: "Data kontekstual notifikasi, isinya bervariasi per type",
        properties: {
          postId: { type: "string", nullable: true, example: "cuid_post_123" },
          userId: { type: "string", nullable: true, example: "cuid_user_123" },
          likerId: { type: "string", nullable: true, example: "cuid_user_456" },
          commentId: { type: "string", nullable: true, example: "cuid_comment_123" },
          path: { type: "string", nullable: true, example: "/posts/cuid_post_123" },
        },
      },
      readAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  NotificationSettingItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_setting_123" },
      type: {
        type: "string",
        enum: ["LIKE", "COMMENT", "FOLLOW", "REPLY", "MENTION"],
        example: "LIKE",
      },
      channel: {
        type: "string",
        enum: ["IN_APP", "EMAIL", "PUSH"],
        example: "IN_APP",
      },
      status: {
        type: "string",
        enum: ["ENABLED", "DISABLED"],
        example: "ENABLED",
      },
    },
  },

  // ── Request bodies ───────────────────────────────────────────
  MarkAsReadRequest: {
    type: "object",
    required: ["notificationIds"],
    properties: {
      notificationIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        example: ["cuid_notif_123", "cuid_notif_456"],
        description: "Daftar ID notifikasi yang ingin ditandai sudah dibaca",
      },
    },
  },

  DeleteNotificationRequest: {
    type: "object",
    required: ["notificationIds"],
    properties: {
      notificationIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        example: ["cuid_notif_123", "cuid_notif_456"],
        description: "Daftar ID notifikasi yang ingin dihapus",
      },
    },
  },

  UpdateNotificationSettingRequest: {
    type: "object",
    required: ["notificationId", "status"],
    properties: {
      notificationId: {
        type: "string",
        example: "cuid_setting_123",
        description: "ID dari notification setting yang ingin diubah",
      },
      status: {
        type: "string",
        enum: ["ENABLED", "DISABLED"],
        example: "DISABLED",
        description: "Status baru untuk setting ini",
      },
    },
  },
};

// ── Reusable helpers ─────────────────────────────────────────────
const simpleOK = (message: string) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: 200 },
        message: { type: "string", example: message },
      },
    },
  },
});

const unauthorizedRef = { $ref: "#/components/responses/UnauthorizedError" };
const tooManyRef = { $ref: "#/components/responses/TooManyRequests" };
const errorContent = { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } };
const security = [{ bearerAuth: [] }, { cookieAuth: [] }];

export const notificationPaths = {
  // ── GET /v1/notifications/unread-count ───────────────────────
  "/v1/notifications/unread-count": {
    get: {
      tags: ["Notifications"],
      summary: "Ambil jumlah notifikasi belum dibaca",
      description: "Mengembalikan total notifikasi yang belum dibaca (`readAt: null`) milik user yang sedang login. Cocok untuk badge counter di UI.",
      security,
      responses: {
        200: {
          description: "Jumlah notifikasi belum dibaca berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "get unread notification count successfully" },
                  data: {
                    type: "object",
                    properties: {
                      unreadCount: { type: "integer", example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: unauthorizedRef,
      },
    },
  },

  // ── GET /v1/notifications ────────────────────────────────────
  "/v1/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "Ambil daftar notifikasi",
      description: "Mengembalikan notifikasi milik user yang sedang login dengan pagination. Bisa difilter by `type` dan dicari by `search` (matching description).",
      security,
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "string", default: "1" },
          description: "Nomor halaman",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "string", default: "10" },
          description: "Jumlah item per halaman",
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Filter by kata kunci dalam description notifikasi",
        },
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["LIKE", "COMMENT", "FOLLOW", "REPLY", "MENTION"] },
          description: "Filter by jenis notifikasi",
        },
        {
          name: "orderBy",
          in: "query",
          schema: { type: "string", enum: ["createdAt"], default: "createdAt" },
          description: "Field untuk sorting",
        },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          description: "Arah sorting",
        },
      ],
      responses: {
        200: {
          description: "Daftar notifikasi berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "get notifications successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/NotificationItem" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      pagination: { $ref: "#/components/schemas/PaginationMeta" },
                      filter: {
                        type: "object",
                        properties: {
                          search: { type: "string", nullable: true },
                          orderBy: { type: "string", example: "createdAt" },
                          sortBy: { type: "string", example: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: unauthorizedRef,
      },
    },
  },

  // ── GET /v1/notifications/settings ──────────────────────────
  "/v1/notifications/settings": {
    get: {
      tags: ["Notifications"],
      summary: "Ambil notification settings",
      description: "Mengembalikan semua pengaturan notifikasi milik user (per type dan channel). Setting dibuat otomatis saat register.",
      security,
      responses: {
        200: {
          description: "Notification settings berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "get notification settings successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/NotificationSettingItem" },
                  },
                },
              },
            },
          },
        },
        401: unauthorizedRef,
      },
    },

    // ── PUT /v1/notifications/settings ────────────────────────
    put: {
      tags: ["Notifications"],
      summary: "Update satu notification setting",
      description: "Mengaktifkan atau menonaktifkan satu setting notifikasi berdasarkan `notificationId`. Perubahan dicatat di activity log.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdateNotificationSettingRequest" } },
        },
      },
      responses: {
        200: {
          description: "Notification setting berhasil diupdate",
          content: simpleOK("update notification settings successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
      },
    },
  },

  // ── POST /v1/notifications/read ──────────────────────────────
  "/v1/notifications/read": {
    post: {
      tags: ["Notifications"],
      summary: "Tandai notifikasi sebagai sudah dibaca",
      description: "Menandai satu atau lebih notifikasi sebagai sudah dibaca dengan mengisi `readAt`. Hanya notifikasi milik user yang sedang login yang bisa diupdate.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/MarkAsReadRequest" } },
        },
      },
      responses: {
        200: {
          description: "Notifikasi berhasil ditandai dibaca",
          content: simpleOK("mark notification as read successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
      },
    },
  },

  // ── DELETE /v1/notifications/delete ─────────────────────────
  "/v1/notifications/delete": {
    delete: {
      tags: ["Notifications"],
      summary: "Hapus notifikasi",
      description: "Menghapus permanen satu atau lebih notifikasi milik user. Penghapusan dicatat di activity log.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/DeleteNotificationRequest" } },
        },
      },
      responses: {
        200: {
          description: "Notifikasi berhasil dihapus",
          content: simpleOK("notification deleted successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
      },
    },
  },
};
