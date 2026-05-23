// Schema & path definitions untuk module comments
// Diimport dan di-merge ke spec di docs.route.ts

export const commentSchemas = {
  // ── Sub-schemas ──────────────────────────────────────────────
  CommentAuthor: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_user_123" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri", nullable: true },
    },
  },

  ReplyItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_reply_123" },
      parentId: { type: "string", example: "cuid_comment_123" },
      content: { type: "string", example: "I agree with your point!" },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/CommentAuthor" },
      totalLikes: { type: "integer", example: 2 },
      isLiked: { type: "boolean", example: false },
      isEditable: { type: "boolean", example: false },
      isEdited: { type: "boolean", example: false },
      lastEditedAt: { type: "string", format: "date-time", nullable: true },
    },
  },

  CommentItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_comment_123" },
      content: { type: "string", example: "Great post!" },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/CommentAuthor" },
      isLiked: { type: "boolean", example: false },
      isEditable: { type: "boolean", example: false },
      isEdited: { type: "boolean", example: false },
      lastEditedAt: { type: "string", format: "date-time" },
      totalLikes: { type: "integer", example: 10 },
      totalReplies: { type: "integer", example: 3 },
      replies: {
        type: "array",
        description: "Preview 2 reply terbaru. Untuk semua reply gunakan GET /:postId/comments/:commentId",
        items: { $ref: "#/components/schemas/ReplyItem" },
      },
    },
  },

  // ── Request bodies ───────────────────────────────────────────
  CreateCommentRequest: {
    type: "object",
    required: ["postId", "content"],
    properties: {
      postId: {
        type: "string",
        example: "cuid_post_123",
        description: "ID post yang dikomentari",
      },
      commentId: {
        type: "string",
        example: "cuid_comment_123",
        nullable: true,
        description: "Isi jika ini adalah reply ke komentar. Kosongkan untuk komentar baru. Tidak bisa reply ke reply.",
      },
      content: {
        type: "string",
        minLength: 1,
        example: "Great post!",
      },
    },
  },

  EditCommentRequest: {
    type: "object",
    properties: {
      commentId: {
        type: "string",
        example: "cuid_comment_123",
        description: "ID komentar yang ingin diedit",
      },
      content: {
        type: "string",
        minLength: 1,
        example: "Updated comment content",
      },
    },
  },
};

// ── Reusable helpers ─────────────────────────────────────────────
const paginationParams = [
  { name: "page", in: "query", schema: { type: "string", default: "1" }, description: "Nomor halaman" },
  { name: "limit", in: "query", schema: { type: "string", default: "10" }, description: "Jumlah item per halaman" },
  {
    name: "orderBy",
    in: "query",
    schema: { type: "string", enum: ["createdAt"] },
    description: "Field untuk sorting",
  },
  {
    name: "sortBy",
    in: "query",
    schema: { type: "string", enum: ["asc", "desc"] },
    description: "Arah sorting",
  },
];

const paginatedResponse = (itemSchema: string, message: string) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: 200 },
        message: { type: "string", example: message },
        data: { type: "array", items: { $ref: `#/components/schemas/${itemSchema}` } },
        meta: { $ref: "#/components/schemas/PaginationMeta" },
      },
    },
  },
});

const simpleOK = (message: string, statusCode = 200) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: statusCode },
        message: { type: "string", example: message },
      },
    },
  },
});

const unauthorizedRef = { $ref: "#/components/responses/UnauthorizedError" };
const tooManyRef = { $ref: "#/components/responses/TooManyRequests" };
const errorContent = { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } };
const security = [{ bearerAuth: [] }, { cookieAuth: [] }];

export const commentPaths = {
  // ── POST /v1/comments ────────────────────────────────────────
  "/v1/comments": {
    post: {
      tags: ["Comments"],
      summary: "Buat komentar atau reply",
      description:
        "Membuat komentar baru pada post, atau reply ke komentar yang sudah ada. Isi `commentId` untuk reply — tidak bisa reply ke reply (max 1 level). Notifikasi otomatis dikirim ke pemilik post/komentar jika setting notifikasi mereka aktif.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/CreateCommentRequest" } },
        },
      },
      responses: {
        201: {
          description: "Komentar berhasil dibuat",
          content: simpleOK("Comment created successfully", 201),
        },
        400: {
          description: "Validasi gagal atau mencoba reply ke reply",
          content: errorContent,
        },
        401: unauthorizedRef,
        404: {
          description: "Post atau parent komentar tidak ditemukan",
          content: errorContent,
        },
      },
    },
  },

  // ── GET /v1/comments/:postId/comments ────────────────────────
  "/v1/comments/{postId}/comments": {
    get: {
      tags: ["Comments"],
      summary: "Ambil komentar utama sebuah post",
      description:
        "Mengembalikan daftar komentar level pertama (bukan reply) dari sebuah post, diurutkan by `createdAt desc`. Setiap komentar menyertakan preview 2 reply terbaru. Untuk semua reply gunakan endpoint `GET /:postId/comments/:commentId`.",
      security,
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID post yang ingin diambil komentarnya",
          schema: { type: "string", example: "cuid_post_123" },
        },
        ...paginationParams,
      ],
      responses: {
        200: {
          description: "Daftar komentar berhasil diambil",
          content: paginatedResponse("CommentItem", "Comments retrieved successfully"),
        },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
      },
    },

    // ── PUT /v1/comments/:postId/comments ──────────────────────
    put: {
      tags: ["Comments"],
      summary: "Edit komentar",
      description: "Mengupdate isi komentar. Hanya bisa diedit oleh pemilik komentar. Post harus valid dan komentar harus ada.",
      security,
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID post tempat komentar berada",
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/EditCommentRequest" } },
        },
      },
      responses: {
        200: {
          description: "Komentar berhasil diedit",
          content: simpleOK("Comment updated successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
        404: {
          description: "Post atau komentar tidak ditemukan",
          content: errorContent,
        },
      },
    },
  },

  // ── GET /v1/comments/:postId/comments/:commentId ─────────────
  "/v1/comments/{postId}/comments/{commentId}": {
    get: {
      tags: ["Comments"],
      summary: "Ambil replies dari sebuah komentar",
      description: "Mengembalikan semua reply dari komentar tertentu dengan pagination, diurutkan by `createdAt asc`. Gunakan ini untuk load-more replies setelah preview 2 reply dari endpoint parent comments.",
      security,
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID post tempat komentar berada",
          schema: { type: "string", example: "cuid_post_123" },
        },
        {
          name: "commentId",
          in: "path",
          required: true,
          description: "ID komentar induk yang ingin diambil repliesnya",
          schema: { type: "string", example: "cuid_comment_123" },
        },
        ...paginationParams,
      ],
      responses: {
        200: {
          description: "Daftar replies berhasil diambil",
          content: paginatedResponse("ReplyItem", "Replies retrieved successfully"),
        },
        401: unauthorizedRef,
      },
    },
  },

  // ── POST /v1/comments/:commentId/like ────────────────────────
  "/v1/comments/{commentId}/like": {
    post: {
      tags: ["Comments"],
      summary: "Like komentar",
      description: "Memberikan like pada sebuah komentar. Tidak bisa like komentar yang sudah di-like. Notifikasi dikirim ke pemilik komentar jika setting notifikasi mereka aktif.",
      security,
      parameters: [
        {
          name: "commentId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_comment_123" },
        },
      ],
      responses: {
        200: {
          description: "Komentar berhasil di-like",
          content: simpleOK("Comment liked successfully"),
        },
        400: { description: "Komentar sudah di-like atau validasi gagal", content: errorContent },
        401: unauthorizedRef,
        404: { description: "Komentar tidak ditemukan", content: errorContent },
      },
    },
  },

  // ── POST /v1/comments/:commentId/unlike ──────────────────────
  "/v1/comments/{commentId}/unlike": {
    post: {
      tags: ["Comments"],
      summary: "Unlike komentar",
      description: "Mencabut like dari sebuah komentar. Tidak bisa unlike komentar yang belum di-like.",
      security,
      parameters: [
        {
          name: "commentId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_comment_123" },
        },
      ],
      responses: {
        200: {
          description: "Like berhasil dicabut",
          content: simpleOK("Comment unliked successfully"),
        },
        401: unauthorizedRef,
        404: { description: "Komentar atau like tidak ditemukan", content: errorContent },
      },
    },
  },
};
