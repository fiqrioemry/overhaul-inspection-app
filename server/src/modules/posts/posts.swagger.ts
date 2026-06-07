// Schema & path definitions untuk module posts
// Diimport dan di-merge ke spec di docs.route.ts

export const postSchemas = {
  // ── Shared sub-schemas ───────────────────────────────────────
  GalleryItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_gallery_123" },
      url: { type: "string", format: "uri", example: "https://cdn.example.com/posts/img.jpg" },
      order: { type: "integer", example: 0 },
    },
  },

  PostAuthor: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_user_123" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri" },
    },
  },

  CommentItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_comment_123" },
      content: { type: "string", example: "Nice post!" },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/PostAuthor" },
      totalReplies: { type: "integer", example: 3 },
      totalLikes: { type: "integer", example: 5 },
      isLiked: { type: "boolean", example: false },
      isEditable: { type: "boolean", example: false },
    },
  },

  // ── Original post preview (dipakai di dalam repost) ──────────
  OriginalPostPreview: {
    type: "object",
    nullable: true,
    description: "Preview post asli. null jika post bukan repost.",
    properties: {
      id: { type: "string", example: "cuid_post_original" },
      title: { type: "string", example: "Original post title" },
      content: { type: "string", example: "Original post content..." },
      galleries: {
        type: "array",
        items: { $ref: "#/components/schemas/GalleryItem" },
      },
      user: { $ref: "#/components/schemas/PostAuthor" },
    },
  },

  // ── Post list item (dipakai di public, following, by user) ───
  PostItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_post_123" },
      title: { type: "string", example: "My first post" },
      content: { type: "string", example: "Hello world, this is my first post!" },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/PostAuthor" },
      galleries: {
        type: "array",
        items: { $ref: "#/components/schemas/GalleryItem" },
      },
      totalLikes: { type: "integer", example: 42 },
      totalComments: { type: "integer", example: 7 },
      isLiked: { type: "boolean", example: false },
      isEditable: { type: "boolean", example: false },
      isFollowing: { type: "boolean", example: true },
      isSaved: { type: "boolean", example: false },
      isReported: { type: "boolean", example: false },
      isRepost: { type: "boolean", example: false, description: "true jika post ini adalah hasil repost" },
      isReposted: { type: "boolean", example: false, description: "true jika user yang sedang login sudah pernah merepost post ini (atau originalnya)" },
      shareCount: { type: "integer", example: 0, description: "Jumlah user yang sudah merepost post ini" },
      caption: { type: "string", nullable: true, example: "Check this out!", description: "Komentar singkat dari reposter. null untuk non-repost atau plain repost." },
      originalPost: { $ref: "#/components/schemas/OriginalPostPreview" },
    },
  },

  // ── Post detail (tambahan: comments, totalGalleries) ─────────
  PostDetail: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_post_123" },
      title: { type: "string", example: "My first post" },
      content: { type: "string", example: "Hello world!" },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/PostAuthor" },
      galleries: {
        type: "array",
        items: { $ref: "#/components/schemas/GalleryItem" },
      },
      comments: {
        type: "array",
        items: { $ref: "#/components/schemas/CommentItem" },
      },
      totalLikes: { type: "integer", example: 42 },
      totalComments: { type: "integer", example: 7 },
      totalGalleries: { type: "integer", example: 3 },
      isLiked: { type: "boolean", example: false },
      isEditable: { type: "boolean", example: false },
      isFollowing: { type: "boolean", example: true },
      isSaved: { type: "boolean", example: false },
      isReported: { type: "boolean", example: false },
      isRepost: { type: "boolean", example: false },
      isReposted: { type: "boolean", example: false, description: "true jika user yang sedang login sudah pernah merepost post ini" },
      shareCount: { type: "integer", example: 0 },
      caption: { type: "string", nullable: true, example: null },
      originalPost: { $ref: "#/components/schemas/OriginalPostPreview" },
    },
  },

  // ── Share list item (dipakai di GET /posts/:postId/shares) ────
  ShareListItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_repost_123", description: "ID post repost (bukan original)" },
      caption: { type: "string", nullable: true, example: "Check this out!" },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/PostAuthor" },
    },
  },

  // ── Saved post (tambahan: bookmarkId) ─────────────────────────
  SavedPostItem: {
    allOf: [
      { $ref: "#/components/schemas/PostItem" },
      {
        type: "object",
        properties: {
          bookmarkId: { type: "string", example: "cuid_bookmark_123" },
        },
      },
    ],
  },

  // ── Pagination meta ──────────────────────────────────────────
  PaginationMeta: {
    type: "object",
    properties: {
      pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalItems: { type: "integer", example: 100 },
          totalPages: { type: "integer", example: 10 },
        },
      },
    },
  },

  // ── Request bodies ───────────────────────────────────────────
  CreatePostRequest: {
    type: "object",
    required: ["title", "content", "galleries"],
    properties: {
      title: { type: "string", minLength: 1, example: "My first post" },
      content: { type: "string", minLength: 5, example: "Hello world, this is my first post!" },
      galleries: {
        type: "array",
        minItems: 1,
        maxItems: 10,
        items: {
          type: "string",
          format: "binary",
          description: "JPEG / PNG / WebP, max 5MB per file",
        },
      },
    },
  },

  UpdatePostRequest: {
    type: "object",
    required: ["title", "content"],
    properties: {
      title: { type: "string", minLength: 1, example: "Updated title" },
      content: { type: "string", minLength: 10, example: "Updated content goes here." },
    },
  },

  ReportPostRequest: {
    type: "object",
    required: ["reason"],
    properties: {
      reason: {
        type: "string",
        enum: ["SPAM", "HARASSMENT", "HATE_SPEECH", "VIOLENCE", "ADULT_CONTENT", "MISINFORMATION", "OTHER"],
        example: "SPAM",
      },
      description: {
        type: "string",
        maxLength: 1000,
        example: "This post contains repeated spam links.",
        description: "Wajib diisi jika reason adalah OTHER",
      },
    },
  },

  SharePostRequest: {
    type: "object",
    properties: {
      caption: {
        type: "string",
        maxLength: 500,
        nullable: true,
        example: "Check this out!",
        description: "Komentar singkat dari reposter (opsional). Kosongkan untuk plain repost.",
      },
    },
  },
};

// ── Query parameter helpers ──────────────────────────────────────
const paginationParams = [
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

// ── Response body helpers ────────────────────────────────────────
const paginatedResponse = (itemSchema: string, message: string) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: 200 },
        message: { type: "string", example: message },
        data: {
          type: "array",
          items: { $ref: `#/components/schemas/${itemSchema}` },
        },
        meta: { $ref: "#/components/schemas/PaginationMeta" },
      },
    },
  },
});

const singleResponse = (schemaRef: string, message: string) => ({
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

export const postPaths = {
  // ── GET /v1/posts/public ─────────────────────────────────────
  "/v1/posts/public": {
    get: {
      tags: ["Posts"],
      summary: "Ambil public posts",
      description: "Mengembalikan posts dari semua user selain user yang sedang login. Mendukung pagination dan sorting.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: paginationParams,
      responses: {
        200: {
          description: "Daftar public posts berhasil diambil",
          content: paginatedResponse("PostItem", "Public posts retrieved successfully"),
        },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/posts/following ──────────────────────────────────
  "/v1/posts/following": {
    get: {
      tags: ["Posts"],
      summary: "Ambil posts dari following",
      description: "Mengembalikan posts dari user yang di-follow oleh user yang sedang login.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: paginationParams,
      responses: {
        200: {
          description: "Daftar following posts berhasil diambil",
          content: paginatedResponse("PostItem", "Following posts retrieved successfully"),
        },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/posts/saved ──────────────────────────────────────
  "/v1/posts/saved": {
    get: {
      tags: ["Posts"],
      summary: "Ambil saved posts (bookmark)",
      description: "Mengembalikan semua posts yang di-bookmark oleh user yang sedang login.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: paginationParams,
      responses: {
        200: {
          description: "Daftar saved posts berhasil diambil",
          content: paginatedResponse("SavedPostItem", "Saved posts retrieved successfully"),
        },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/posts/:targetId/user ─────────────────────────────
  "/v1/posts/{targetId}/user": {
    get: {
      tags: ["Posts"],
      summary: "Ambil posts milik user tertentu",
      description: "Mengembalikan semua posts milik user berdasarkan `targetId`.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "targetId",
          in: "path",
          required: true,
          description: "ID user yang ingin dilihat postnya",
          schema: { type: "string", example: "cuid_user_123" },
        },
        ...paginationParams,
      ],
      responses: {
        200: {
          description: "Daftar posts user berhasil diambil",
          content: paginatedResponse("PostItem", "Public posts retrieved successfully"),
        },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/posts/:postId ────────────────────────────────────
  "/v1/posts/{postId}": {
    get: {
      tags: ["Posts"],
      summary: "Ambil detail post",
      description: "Mengembalikan detail lengkap sebuah post termasuk komentar dan galeri.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID post yang ingin dilihat",
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: {
          description: "Detail post berhasil diambil",
          content: singleResponse("PostDetail", "Post detail retrieved successfully"),
        },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },

    // ── PUT /v1/posts/:postId ──────────────────────────────────
    put: {
      tags: ["Posts"],
      summary: "Update post",
      description: "Mengupdate title dan content post. Hanya bisa dilakukan oleh pemilik post.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdatePostRequest" } },
        },
      },
      responses: {
        200: {
          description: "Post berhasil diupdate",
          content: simpleOK("Post updated successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },

    // ── DELETE /v1/posts/:postId ───────────────────────────────
    delete: {
      tags: ["Posts"],
      summary: "Hapus post",
      description: "Soft-delete post. Hanya bisa dilakukan oleh pemilik post.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: {
          description: "Post berhasil dihapus",
          content: simpleOK("Post deleted successfully"),
        },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts ───────────────────────────────────────────
  "/v1/posts": {
    post: {
      tags: ["Posts"],
      summary: "Buat post baru",
      description: "Membuat post baru dengan galeri gambar. Request menggunakan `multipart/form-data`. Minimal 1 gambar, maksimal 10. Tiap file max 5MB (JPEG/PNG/WebP).",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": { schema: { $ref: "#/components/schemas/CreatePostRequest" } },
        },
      },
      responses: {
        201: {
          description: "Post berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 201 },
                  message: { type: "string", example: "Post created successfully" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "cuid_post_123" },
                      title: { type: "string", example: "My first post" },
                      content: { type: "string", example: "Hello world!" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Validasi gagal atau file tidak valid", content: errorContent },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts/:postId/like ──────────────────────────────
  "/v1/posts/{postId}/like": {
    post: {
      tags: ["Posts"],
      summary: "Like post",
      description: "Memberikan like pada sebuah post. Tidak bisa like post yang sudah di-like.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: { description: "Post berhasil di-like", content: simpleOK("You liked the post") },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        409: { description: "Post sudah di-like sebelumnya", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts/:postId/unlike ────────────────────────────
  "/v1/posts/{postId}/unlike": {
    post: {
      tags: ["Posts"],
      summary: "Unlike post",
      description: "Mencabut like dari sebuah post. Tidak bisa unlike post yang belum di-like.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: { description: "Like berhasil dicabut", content: simpleOK("You unliked the post") },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        409: { description: "Post belum di-like", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts/:postId/save ──────────────────────────────
  "/v1/posts/{postId}/save": {
    post: {
      tags: ["Posts"],
      summary: "Bookmark post",
      description: "Menyimpan post ke daftar bookmark user.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: { description: "Post berhasil di-bookmark", content: simpleOK("Post bookmarked successfully") },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        409: { description: "Post sudah di-bookmark sebelumnya", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts/:postId/unsave ────────────────────────────
  "/v1/posts/{postId}/unsave": {
    post: {
      tags: ["Posts"],
      summary: "Hapus bookmark post",
      description: "Menghapus post dari daftar bookmark user.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: { description: "Bookmark berhasil dihapus", content: simpleOK("Post unbookmarked successfully") },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        409: { description: "Post belum di-bookmark", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts/:postId/report ────────────────────────────
  "/v1/posts/{postId}/report": {
    post: {
      tags: ["Posts"],
      summary: "Laporkan post",
      description: "Melaporkan post dengan alasan tertentu. Setiap user hanya bisa melaporkan satu post sekali. Jika `reason` adalah `OTHER`, field `description` wajib diisi. Post akan otomatis di-takedown jika laporan mencapai threshold.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ReportPostRequest" } },
        },
      },
      responses: {
        200: { description: "Post berhasil dilaporkan", content: simpleOK("Post reported successfully") },
        400: { description: "Validasi gagal atau description kosong saat reason OTHER", content: errorContent },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        409: { description: "Post sudah pernah dilaporkan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/posts/:postId/share ─────────────────────────────
  // ── DELETE /v1/posts/:postId/share ───────────────────────────
  "/v1/posts/{postId}/share": {
    post: {
      tags: ["Posts"],
      summary: "Repost (share) post",
      description:
        "Membuat repost dari sebuah post. `:postId` bisa berupa post biasa atau repost — service selalu menyelesaikan ke root original. " +
        "Sertakan `caption` untuk quote-repost, atau kosongkan untuk plain repost. " +
        "Guard: tidak bisa repost post sendiri (400), tidak bisa repost ulang post yang sudah di-repost (409). " +
        "Menambah `shareCount` pada original post dan mengirim notifikasi `REPOST` ke pemilik original (silent jika diri sendiri).",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID post yang ingin di-repost (boleh original maupun repost)",
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/SharePostRequest" } },
        },
      },
      responses: {
        201: {
          description: "Repost berhasil dibuat",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 201 },
                  message: { type: "string", example: "Post reposted successfully" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "cuid_repost_123", description: "ID post repost yang baru dibuat" },
                      originalPostId: { type: "string", example: "cuid_post_original" },
                      caption: { type: "string", nullable: true, example: "Check this out!" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Mencoba repost post sendiri", content: errorContent },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        409: { description: "User sudah pernah merepost post ini", content: errorContent },
        429: tooManyRef,
      },
    },

    delete: {
      tags: ["Posts"],
      summary: "Hapus repost (unshare)",
      description:
        "Menghapus repost yang dimiliki user untuk post tertentu. `:postId` adalah ID dari **original** post (bukan ID repost). " +
        "Mengurangi `shareCount` pada original post secara atomik.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID original post yang ingin di-unshare",
          schema: { type: "string", example: "cuid_post_123" },
        },
      ],
      responses: {
        200: { description: "Repost berhasil dihapus", content: simpleOK("Repost removed successfully") },
        401: unauthorizedRef,
        404: { description: "User tidak pernah merepost post ini", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/posts/:postId/shares ─────────────────────────────
  "/v1/posts/{postId}/shares": {
    get: {
      tags: ["Posts"],
      summary: "Daftar user yang merepost",
      description: "Mengembalikan daftar repost dari sebuah post secara terpaginasi, diurutkan dari yang terbaru.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          description: "ID original post",
          schema: { type: "string", example: "cuid_post_123" },
        },
        {
          name: "page",
          in: "query",
          schema: { type: "string", default: "1" },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "string", default: "10" },
        },
      ],
      responses: {
        200: {
          description: "Daftar share berhasil diambil",
          content: paginatedResponse("ShareListItem", "Post shares fetched successfully"),
        },
        401: unauthorizedRef,
        404: { description: "Post tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },
};
