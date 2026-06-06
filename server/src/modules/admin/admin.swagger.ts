// Schema & path definitions untuk module admin
// Diimport dan di-merge ke spec di docs.route.ts

export const adminSchemas = {
  // ── Sub-schemas ──────────────────────────────────────────────
  AdminReportPost: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_post_123" },
      content: { type: "string", example: "This is the reported post content..." },
      author: {
        type: "object",
        properties: {
          id: { type: "string", example: "cuid_user_123" },
          name: { type: "string", example: "John Doe" },
          username: { type: "string", example: "johndoe_x7k" },
        },
      },
    },
  },

  AdminReportItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_report_123" },
      reason: { type: "string", enum: ["SPAM", "HARASSMENT", "MISINFORMATION", "VIOLENCE", "OTHER"], example: "SPAM" },
      description: { type: "string", nullable: true, example: "This user keeps posting spam links" },
      status: { type: "string", enum: ["PENDING", "REVIEWED", "DISMISSED"], example: "PENDING" },
      actionTaken: { type: "string", nullable: true, example: "Post removed and user warned" },
      createdAt: { type: "string", format: "date-time" },
      reviewedAt: { type: "string", format: "date-time", nullable: true },
      post: { $ref: "#/components/schemas/AdminReportPost" },
      reporter: {
        type: "object",
        properties: {
          id: { type: "string", example: "cuid_user_456" },
          name: { type: "string", example: "Jane Doe" },
          username: { type: "string", example: "janedoe" },
        },
      },
      reviewedBy: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string", example: "cuid_admin_123" },
          name: { type: "string", example: "Admin User" },
          username: { type: "string", example: "admin" },
        },
      },
    },
  },

  AdminUserItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_user_123" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      email: { type: "string", format: "email", example: "john@example.com" },
      avatar: { type: "string", format: "uri", nullable: true },
      role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
      status: { type: "string", enum: ["ACTIVE", "INACTIVE", "BANNED"], example: "ACTIVE" },
      isPublic: { type: "boolean", example: true },
      twoFactorEnabled: { type: "boolean", example: false },
      createdAt: { type: "string", format: "date-time" },
      lastLogin: { type: "string", format: "date-time", nullable: true },
      totalPosts: { type: "integer", example: 42 },
      totalFollowers: { type: "integer", example: 300 },
      totalFollowings: { type: "integer", example: 150 },
    },
  },

  AdminStats: {
    type: "object",
    properties: {
      totalUsers: { type: "integer", example: 1500 },
      activeUsers: { type: "integer", example: 1200 },
      bannedUsers: { type: "integer", example: 15 },
      totalPosts: { type: "integer", example: 8400 },
      totalComments: { type: "integer", example: 32000 },
      pendingReports: { type: "integer", example: 7 },
      reviewedReports: { type: "integer", example: 120 },
      dismissedReports: { type: "integer", example: 34 },
    },
  },

  // ── Request bodies ───────────────────────────────────────────
  UpdateReportRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["REVIEWED", "DISMISSED"],
        example: "REVIEWED",
        description: "Status hasil review laporan",
      },
      actionTaken: {
        type: "string",
        nullable: true,
        maxLength: 500,
        example: "Post removed and user issued a warning",
        description: "Deskripsi tindakan yang diambil admin",
      },
    },
  },

  UpdateUserStatusRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE", "BANNED"],
        example: "BANNED",
        description: "Status baru untuk user",
      },
    },
  },
};

// ── Reusable helpers ─────────────────────────────────────────────
const paginatedResponse = (itemSchema: string, message: string, extra?: object) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: 200 },
        message: { type: "string", example: message },
        data: { type: "array", items: { $ref: `#/components/schemas/${itemSchema}` } },
        meta: {
          type: "object",
          properties: {
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                totalItems: { type: "integer", example: 100 },
                totalPages: { type: "integer", example: 5 },
              },
            },
            filter: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        ...extra,
      },
    },
  },
});

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

const dataResponse = (schemaRef: string, message: string) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: 200 },
        message: { type: "string", example: message },
        data: { $ref: `#/components/schemas/${schemaRef}` },
      },
    },
  },
});

const unauthorizedRef = { $ref: "#/components/responses/UnauthorizedError" };
const tooManyRef = { $ref: "#/components/responses/TooManyRequests" };
const errorContent = { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } };
const security = [{ bearerAuth: [] }, { cookieAuth: [] }];

export const adminPaths = {
  // ── GET /v1/admin/reports ────────────────────────────────────
  "/v1/admin/reports": {
    get: {
      tags: ["Admin"],
      summary: "Ambil daftar laporan post",
      description: "Mengembalikan laporan post dengan filter status dan reason. Hanya ADMIN.",
      security,
      parameters: [
        { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "REVIEWED", "DISMISSED"] }, description: "Filter by status laporan" },
        { name: "reason", in: "query", schema: { type: "string", enum: ["SPAM", "HARASSMENT", "MISINFORMATION", "VIOLENCE", "OTHER"] }, description: "Filter by alasan laporan" },
        { name: "page", in: "query", schema: { type: "string", default: "1" }, description: "Nomor halaman" },
        { name: "limit", in: "query", schema: { type: "string", default: "20" }, description: "Item per halaman" },
      ],
      responses: {
        200: {
          description: "Daftar laporan berhasil diambil",
          content: paginatedResponse("AdminReportItem", "Get reports successful"),
        },
        401: unauthorizedRef,
        403: { description: "Akses ditolak — hanya ADMIN", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/admin/reports/:reportId ───────────────────────
  "/v1/admin/reports/{reportId}": {
    patch: {
      tags: ["Admin"],
      summary: "Review laporan post",
      description: "Menandai laporan sebagai REVIEWED atau DISMISSED dan mencatat tindakan yang diambil. Hanya ADMIN.",
      security,
      parameters: [
        {
          name: "reportId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_report_123" },
          description: "ID laporan yang ingin di-review",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdateReportRequest" } },
        },
      },
      responses: {
        200: {
          description: "Laporan berhasil di-review",
          content: simpleOK("Update report successful"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Akses ditolak — hanya ADMIN", content: errorContent },
        404: { description: "Laporan tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/admin/users ──────────────────────────────────────
  "/v1/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "Ambil daftar semua user",
      description: "Mengembalikan daftar seluruh user dengan statistik (total post, followers, followings). Mendukung search dan pagination. Hanya ADMIN.",
      security,
      parameters: [
        { name: "search", in: "query", schema: { type: "string" }, description: "Filter by nama atau username" },
        { name: "page", in: "query", schema: { type: "string", default: "1" }, description: "Nomor halaman" },
        { name: "limit", in: "query", schema: { type: "string", default: "20" }, description: "Item per halaman" },
      ],
      responses: {
        200: {
          description: "Daftar user berhasil diambil",
          content: paginatedResponse("AdminUserItem", "Get users successful"),
        },
        401: unauthorizedRef,
        403: { description: "Akses ditolak — hanya ADMIN", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/admin/users/:userId/status ────────────────────
  "/v1/admin/users/{userId}/status": {
    patch: {
      tags: ["Admin"],
      summary: "Update status user",
      description: "Mengubah status user menjadi ACTIVE, INACTIVE, atau BANNED. Admin tidak bisa mengubah status diri sendiri. Hanya ADMIN.",
      security,
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_user_123" },
          description: "ID user yang ingin diubah statusnya",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdateUserStatusRequest" } },
        },
      },
      responses: {
        200: {
          description: "Status user berhasil diupdate",
          content: simpleOK("Update user status successful"),
        },
        400: { description: "Tidak bisa mengubah status diri sendiri atau validasi gagal", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Akses ditolak — hanya ADMIN", content: errorContent },
        404: { description: "User tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/admin/stats ──────────────────────────────────────
  "/v1/admin/stats": {
    get: {
      tags: ["Admin"],
      summary: "Ambil statistik platform",
      description: "Mengembalikan agregat statistik platform: total user, post, komentar, dan laporan berdasarkan status. Hanya ADMIN.",
      security,
      responses: {
        200: {
          description: "Statistik platform berhasil diambil",
          content: dataResponse("AdminStats", "Get stats successful"),
        },
        401: unauthorizedRef,
        403: { description: "Akses ditolak — hanya ADMIN", content: errorContent },
        429: tooManyRef,
      },
    },
  },
};
