// Schema & path definitions untuk module hashtags
// Diimport dan di-merge ke spec di docs.route.ts

export const hashtagSchemas = {
  // ── Sub-schemas ──────────────────────────────────────────────
  TrendingHashtag: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_hashtag_123" },
      name: { type: "string", example: "technology" },
      postCount: { type: "integer", example: 142, description: "Jumlah post yang menggunakan hashtag ini dalam 7 hari terakhir" },
    },
  },

  HashtagPost: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_post_123" },
      content: { type: "string", example: "Check out this amazing #technology article!" },
      mediaUrls: { type: "array", items: { type: "string", format: "uri" }, nullable: true },
      totalLikes: { type: "integer", example: 24 },
      totalComments: { type: "integer", example: 5 },
      createdAt: { type: "string", format: "date-time" },
      author: {
        type: "object",
        properties: {
          id: { type: "string", example: "cuid_user_123" },
          name: { type: "string", example: "John Doe" },
          username: { type: "string", example: "johndoe_x7k" },
          avatar: { type: "string", format: "uri", nullable: true },
        },
      },
    },
  },
};

// ── Reusable helpers ─────────────────────────────────────────────
const unauthorizedRef = { $ref: "#/components/responses/UnauthorizedError" };
const tooManyRef = { $ref: "#/components/responses/TooManyRequests" };
const errorContent = { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } };
const security = [{ bearerAuth: [] }, { cookieAuth: [] }];

export const hashtagPaths = {
  // ── GET /v1/hashtags/trending ────────────────────────────────
  "/v1/hashtags/trending": {
    get: {
      tags: ["Hashtags"],
      summary: "Ambil hashtag trending",
      description: "Mengembalikan top 10 hashtag paling banyak digunakan dalam 7 hari terakhir, diurutkan by jumlah post descending.",
      security,
      responses: {
        200: {
          description: "Daftar hashtag trending berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Get trending hashtags successful" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TrendingHashtag" },
                    maxItems: 10,
                  },
                },
              },
            },
          },
        },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/hashtags/:name/posts ─────────────────────────────
  "/v1/hashtags/{name}/posts": {
    get: {
      tags: ["Hashtags"],
      summary: "Ambil post by hashtag",
      description: "Mengembalikan daftar post yang mengandung hashtag tertentu, diurutkan by tanggal terbaru. Case-insensitive (mis. `Technology` → `technology`).",
      security,
      parameters: [
        {
          name: "name",
          in: "path",
          required: true,
          schema: { type: "string", example: "technology" },
          description: "Nama hashtag tanpa tanda `#`",
        },
        { name: "page", in: "query", schema: { type: "string", default: "1" }, description: "Nomor halaman" },
        { name: "limit", in: "query", schema: { type: "string", default: "20" }, description: "Item per halaman" },
      ],
      responses: {
        200: {
          description: "Daftar post untuk hashtag berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Get hashtag posts successful" },
                  data: { type: "array", items: { $ref: "#/components/schemas/HashtagPost" } },
                  meta: {
                    type: "object",
                    properties: {
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer", example: 1 },
                          limit: { type: "integer", example: 20 },
                          totalItems: { type: "integer", example: 85 },
                          totalPages: { type: "integer", example: 5 },
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
        404: { description: "Hashtag tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },
};
