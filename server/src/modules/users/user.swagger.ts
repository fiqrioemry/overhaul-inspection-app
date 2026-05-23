// Schema & path definitions untuk module users
// Diimport dan di-merge ke spec di docs.route.ts

export const userSchemas = {
  // ── Sub-schemas ──────────────────────────────────────────────
  UserSearchItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_user_123" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri", nullable: true },
      isFollowing: { type: "boolean", example: false },
      canFollow: { type: "boolean", example: true },
    },
  },

  UserProfile: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_user_123" },
      email: { type: "string", format: "email", example: "john@example.com" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri", nullable: true },
      bio: { type: "string", nullable: true, example: "Software engineer & coffee addict" },
      lastLogin: { type: "string", format: "date-time", nullable: true },
      joinedAt: { type: "string", format: "date-time" },
      isPublic: { type: "boolean", example: true },
      isOwner: { type: "boolean", example: false },
      totalPosts: { type: "integer", example: 12 },
      totalFollowers: { type: "integer", example: 300 },
      totalFollowings: { type: "integer", example: 150 },
      isFollowing: { type: "boolean", example: false },
    },
  },

  FollowItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_user_123" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri", nullable: true },
      isFollowing: { type: "boolean", example: true },
      canFollow: { type: "boolean", example: true },
    },
  },

  // ── Request bodies ───────────────────────────────────────────
  UpdateProfileRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 3, maxLength: 50, example: "John Doe" },
      bio: { type: "string", maxLength: 200, nullable: true, example: "Software engineer & coffee addict" },
      gender: {
        type: "string",
        enum: ["MALE", "FEMALE", "OTHER"],
        nullable: true,
        example: "MALE",
      },
    },
  },

  UpdatePrivacyRequest: {
    type: "object",
    required: ["isPublic"],
    properties: {
      isPublic: { type: "boolean", example: true, description: "true = akun publik, false = akun privat" },
    },
  },

  FollowUserRequest: {
    type: "object",
    required: ["targetUserId"],
    properties: {
      targetUserId: { type: "string", example: "cuid_user_456", description: "ID user yang ingin di-follow/unfollow" },
    },
  },
};

// ── Reusable helpers ─────────────────────────────────────────────
const paginationParams = [
  { name: "page", in: "query", schema: { type: "string", default: "1" }, description: "Nomor halaman" },
  { name: "limit", in: "query", schema: { type: "string", default: "10" }, description: "Jumlah item per halaman" },
  { name: "search", in: "query", schema: { type: "string" }, description: "Filter by username atau nama" },
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
const security = [{ bearerAuth: [] }, { cookieAuth: [] }];

export const userPaths = {
  // ── GET /v1/users ────────────────────────────────────────────
  "/v1/users": {
    get: {
      tags: ["Users"],
      summary: "Cari user berdasarkan username",
      description: "Mencari user aktif berdasarkan query `search`. Mengembalikan maksimal 10 hasil, diurutkan alphabetical.",
      security,
      parameters: [
        {
          name: "search",
          in: "query",
          required: true,
          description: "Keyword pencarian username (case-insensitive)",
          schema: { type: "string", example: "john" },
        },
      ],
      responses: {
        200: {
          description: "Hasil pencarian user",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "User search successful" },
                  data: { type: "array", items: { $ref: "#/components/schemas/UserSearchItem" } },
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

  // ── GET /v1/users/profile/:username ──────────────────────────
  "/v1/users/profile/{username}": {
    get: {
      tags: ["Users"],
      summary: "Ambil profil user by username",
      description: "Mengembalikan profil lengkap user termasuk statistik follower, following, dan post. Field `isOwner` bernilai `true` jika yang mengakses adalah pemilik profil.",
      security,
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          description: "Username user yang ingin dilihat profilnya",
          schema: { type: "string", example: "johndoe_x7k" },
        },
      ],
      responses: {
        200: {
          description: "Profil user berhasil diambil",
          content: singleResponse("UserProfile", "User profile retrieved successfully"),
        },
        401: unauthorizedRef,
        404: { description: "User tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PUT /v1/users/profile ────────────────────────────────────
  "/v1/users/profile": {
    put: {
      tags: ["Users"],
      summary: "Update profil user",
      description: "Mengupdate name, bio, dan gender user yang sedang login.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } },
        },
      },
      responses: {
        200: {
          description: "Profil berhasil diupdate",
          content: simpleOK("User profile updated successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/users/profile/privacy ─────────────────────────
  "/v1/users/profile/privacy": {
    patch: {
      tags: ["Users"],
      summary: "Update privacy setting akun",
      description: "Mengubah akun antara publik dan privat. Akun privat hanya bisa dilihat oleh follower.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdatePrivacyRequest" } },
        },
      },
      responses: {
        200: {
          description: "Privacy setting berhasil diubah",
          content: simpleOK("User privacy updated successfully"),
        },
        400: { description: "Validasi gagal", content: errorContent },
        401: unauthorizedRef,
        404: { description: "User tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/users/profile/avatar ───────────────────────────
  "/v1/users/profile/avatar": {
    patch: {
      tags: ["Users"],
      summary: "Update avatar user",
      description: "Mengupload dan mengganti foto profil user. File lama otomatis di-unmark. Format: JPEG/PNG/WebP, max 2MB.",
      security,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["avatar"],
              properties: {
                avatar: {
                  type: "string",
                  format: "binary",
                  description: "File gambar avatar (JPEG/PNG/WebP, max 2MB)",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Avatar berhasil diupdate",
          content: simpleOK("User avatar updated successfully"),
        },
        401: unauthorizedRef,
        404: { description: "File tidak ditemukan dalam request", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/users/follow ────────────────────────────────────
  "/v1/users/follow": {
    post: {
      tags: ["Users"],
      summary: "Follow user",
      description: "Mengikuti user lain. Tidak bisa follow diri sendiri atau user yang sudah di-follow. Notifikasi otomatis dikirim ke user yang di-follow.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/FollowUserRequest" } },
        },
      },
      responses: {
        200: {
          description: "Berhasil follow user",
          content: simpleOK("User followed successfully"),
        },
        400: { description: "Tidak bisa follow diri sendiri", content: errorContent },
        401: unauthorizedRef,
        404: { description: "User target tidak ditemukan", content: errorContent },
        409: { description: "Sudah follow user ini", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/users/unfollow ──────────────────────────────────
  "/v1/users/unfollow": {
    post: {
      tags: ["Users"],
      summary: "Unfollow user",
      description: "Berhenti mengikuti user lain. Tidak bisa unfollow diri sendiri atau user yang belum di-follow.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/FollowUserRequest" } },
        },
      },
      responses: {
        200: {
          description: "Berhasil unfollow user",
          content: simpleOK("User unfollowed successfully"),
        },
        400: { description: "Tidak bisa unfollow diri sendiri", content: errorContent },
        401: unauthorizedRef,
        404: { description: "User target tidak ditemukan", content: errorContent },
        409: { description: "Belum follow user ini", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/users/followings ─────────────────────────────────
  "/v1/users/followings": {
    get: {
      tags: ["Users"],
      summary: "Ambil daftar following",
      description: "Mengembalikan daftar user yang di-follow oleh `targetUserId`. Jika `targetUserId` tidak diisi, default ke user yang sedang login.",
      security,
      parameters: [
        {
          name: "targetUserId",
          in: "query",
          required: true,
          description: "ID user yang ingin dilihat followingnya",
          schema: { type: "string", example: "cuid_user_123" },
        },
        ...paginationParams,
      ],
      responses: {
        200: {
          description: "Daftar following berhasil diambil",
          content: paginatedResponse("FollowItem", "User followings retrieved successfully"),
        },
        401: unauthorizedRef,
        404: { description: "User tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/users/followers ──────────────────────────────────
  "/v1/users/followers": {
    get: {
      tags: ["Users"],
      summary: "Ambil daftar followers",
      description: "Mengembalikan daftar user yang mengikuti `targetUserId`. Field `isFollowing` menunjukkan apakah current user sudah follow mereka balik.",
      security,
      parameters: [
        {
          name: "targetUserId",
          in: "query",
          required: true,
          description: "ID user yang ingin dilihat followersnya",
          schema: { type: "string", example: "cuid_user_123" },
        },
        ...paginationParams,
      ],
      responses: {
        200: {
          description: "Daftar followers berhasil diambil",
          content: paginatedResponse("FollowItem", "User followers retrieved successfully"),
        },
        401: unauthorizedRef,
        404: { description: "User tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },
};
