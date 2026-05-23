// Schema & path definitions untuk module auth
// Diimport dan di-merge ke swaggerConfig di docs.route.ts

export const authSchemas = {
  // ── Request bodies ──────────────────────────────────────────
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password", "confirmPassword"],
    properties: {
      name: { type: "string", minLength: 3, maxLength: 50, example: "John Doe" },
      email: { type: "string", format: "email", example: "john@example.com" },
      password: {
        type: "string",
        minLength: 10,
        description: "Min 10 karakter, 1 huruf besar, 1 karakter spesial",
        example: "Str0ng@Pass!",
      },
      confirmPassword: { type: "string", example: "Str0ng@Pass!" },
    },
  },

  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "john@example.com" },
      password: { type: "string", example: "Str0ng@Pass!" },
    },
  },

  ForgotPasswordRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email", example: "john@example.com" },
    },
  },

  ResetPasswordRequest: {
    type: "object",
    required: ["password", "confirmPassword"],
    properties: {
      password: { type: "string", minLength: 10, example: "NewStr0ng@Pass!" },
      confirmPassword: { type: "string", example: "NewStr0ng@Pass!" },
    },
  },

  ChangePasswordRequest: {
    type: "object",
    required: ["currentPassword", "newPassword", "confirmPassword"],
    properties: {
      currentPassword: { type: "string", example: "OldStr0ng@Pass!" },
      newPassword: { type: "string", minLength: 10, example: "NewStr0ng@Pass!" },
      confirmPassword: { type: "string", example: "NewStr0ng@Pass!" },
    },
  },

  ResendVerificationEmailRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email", example: "john@example.com" },
    },
  },

  // ── Response bodies ─────────────────────────────────────────
  UserBasic: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid123abc" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri", example: "https://api.dicebear.com/7.x/..." },
      email: { type: "string", format: "email", example: "john@example.com" },
    },
  },

  LoginResponse: {
    type: "object",
    properties: {
      token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
      expiredAt: { type: "string", format: "date-time", example: "2026-06-23T12:00:00.000Z" },
      user: { $ref: "#/components/schemas/UserBasic" },
    },
  },

  MeResponse: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid123abc" },
      name: { type: "string", example: "John Doe" },
      username: { type: "string", example: "johndoe_x7k" },
      avatar: { type: "string", format: "uri" },
      email: { type: "string", format: "email" },
      lastLogin: { type: "string", format: "date-time" },
      joinedAt: { type: "string", format: "date-time" },
      lastChangePasswordAt: { type: "string", format: "date-time", nullable: true },
    },
  },

  SessionItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_session_123" },
      userId: { type: "string", example: "cuid123abc" },
      userAgent: { type: "string", example: "Mozilla/5.0 ..." },
      expiresAt: { type: "string", format: "date-time" },
      loginAt: { type: "string", format: "date-time" },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      status: { type: "integer", example: 400 },
      message: { type: "string", example: "Invalid credentials" },
      cause: { type: "string", example: "INVALID_CREDENTIALS" },
    },
  },

  SuccessResponse: {
    type: "object",
    properties: {
      status: { type: "integer", example: 200 },
      message: { type: "string", example: "Operation successful" },
      data: { type: "object", nullable: true },
    },
  },
};

// Helper untuk response wrapper yang kamu pakai (responseOK / responseCreated)
const successBody = (message: string, dataSchema?: object) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: {
        status: { type: "integer", example: 200 },
        message: { type: "string", example: message },
        ...(dataSchema ? { data: dataSchema } : {}),
      },
    },
  },
});

const errorRef = (code: number, ref: string) => ({
  [code]: { $ref: ref },
});

export const authPaths = {
  // ── POST /v1/auth/register ───────────────────────────────────
  "/v1/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register akun baru",
      description: "Membuat user baru. Email verifikasi dikirim otomatis setelah register.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } },
        },
      },
      responses: {
        201: {
          description: "Register berhasil, email verifikasi dikirim",
          content: successBody("Register successful", {
            type: "string",
            format: "email",
            example: "john@example.com",
          }),
        },
        400: {
          description: "Email sudah terdaftar atau validasi gagal",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── POST /v1/auth/login ──────────────────────────────────────
  "/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login dengan email & password",
      description: "Mengembalikan JWT session token dan set cookie otomatis.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
        },
      },
      responses: {
        200: {
          description: "Login berhasil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Login successful" },
                  data: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
          },
        },
        400: {
          description: "Kredensial tidak valid, email belum diverifikasi, atau akun INACTIVE",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        403: {
          description: "Akun di-banned",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── POST /v1/auth/logout ─────────────────────────────────────
  "/v1/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout sesi aktif",
      description: "Menghapus sesi saat ini berdasarkan token cookie. Membutuhkan autentikasi.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Logout berhasil",
          content: successBody("Logout successful"),
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
      },
    },
  },

  // ── POST /v1/auth/sessions/revoke ────────────────────────────
  "/v1/auth/sessions/revoke": {
    post: {
      tags: ["Auth"],
      summary: "Logout semua sesi (revoke all)",
      description: "Menghapus semua sesi aktif milik user. Berguna saat ganti password atau akun dicurigai.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Semua sesi berhasil dihapus",
          content: successBody("Logout all successful"),
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
      },
    },
  },

  // ── GET /v1/auth/sessions ────────────────────────────────────
  "/v1/auth/sessions": {
    get: {
      tags: ["Auth"],
      summary: "Ambil daftar sesi aktif",
      description: "Mengembalikan semua sesi login aktif milik user yang sedang login.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Daftar sesi berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Get sessions successful" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/SessionItem" },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── DELETE /v1/auth/sessions/:sessionId ──────────────────────
  "/v1/auth/sessions/{sessionId}": {
    delete: {
      tags: ["Auth"],
      summary: "Hapus sesi tertentu",
      description: "Menghapus sesi spesifik berdasarkan ID. Berguna untuk remote logout dari perangkat lain.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          description: "ID sesi yang ingin dihapus",
          schema: { type: "string", example: "cuid_session_123" },
        },
      ],
      responses: {
        200: {
          description: "Sesi berhasil dihapus",
          content: successBody("Delete session successful"),
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        404: {
          description: "Sesi tidak ditemukan",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
      },
    },
  },

  // ── PATCH /v1/auth/change-password ──────────────────────────
  "/v1/auth/change-password": {
    patch: {
      tags: ["Auth"],
      summary: "Ganti password (saat login)",
      description: "Mengganti password user. Semua sesi aktif akan di-invalidate setelah berhasil.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } },
        },
      },
      responses: {
        200: {
          description: "Password berhasil diganti",
          content: successBody("Change password successful"),
        },
        400: {
          description: "Password lama salah atau validasi gagal",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── POST /v1/auth/forgot-password ───────────────────────────
  "/v1/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request reset password",
      description: "Mengirim email link reset password. Selalu mengembalikan 200 untuk mencegah email enumeration.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } },
        },
      },
      responses: {
        200: {
          description: "Email reset password dikirim (jika email terdaftar)",
          content: successBody("Forgot password email sent"),
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── POST /v1/auth/reset-password ────────────────────────────
  "/v1/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password dengan token",
      description: "Mereset password menggunakan token dari email. Token hanya bisa digunakan sekali.",
      parameters: [
        {
          name: "token",
          in: "query",
          required: true,
          description: "Token reset password dari link email",
          schema: { type: "string", example: "abc123randomtoken" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } },
        },
      },
      responses: {
        200: {
          description: "Password berhasil direset",
          content: successBody("Reset password successful"),
        },
        400: {
          description: "Token tidak valid atau sudah digunakan",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── POST /v1/auth/verify-email ───────────────────────────────
  "/v1/auth/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Verifikasi email",
      description: "Memverifikasi email menggunakan token dari link verifikasi.",
      parameters: [
        {
          name: "token",
          in: "query",
          required: true,
          description: "Token verifikasi email dari link email",
          schema: { type: "string", example: "abc123randomtoken" },
        },
      ],
      responses: {
        200: {
          description: "Email berhasil diverifikasi",
          content: successBody("Email verification successful"),
        },
        400: {
          description: "Token tidak valid atau sudah digunakan",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── POST /v1/auth/resend-verification-email ──────────────────
  "/v1/auth/resend-verification-email": {
    post: {
      tags: ["Auth"],
      summary: "Kirim ulang email verifikasi",
      description: "Mengirim ulang email verifikasi. Selalu 200 untuk mencegah email enumeration.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ResendVerificationEmailRequest" } },
        },
      },
      responses: {
        200: {
          description: "Email verifikasi dikirim ulang",
          content: successBody("Resend verification email successful"),
        },
        400: {
          description: "Email sudah terverifikasi",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── GET /v1/auth/me ──────────────────────────────────────────
  "/v1/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Ambil profil user saat ini",
      description: "Mengembalikan data profil lengkap user yang sedang login.",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Data profil berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Get me successful" },
                  data: { $ref: "#/components/schemas/MeResponse" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        404: {
          description: "User tidak ditemukan",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        429: { $ref: "#/components/responses/TooManyRequests" },
      },
    },
  },

  // ── GET /v1/auth/:provider ───────────────────────────────────
  "/v1/auth/{provider}": {
    get: {
      tags: ["Auth"],
      summary: "Redirect ke OAuth provider",
      description: "Mengarahkan user ke halaman login OAuth provider (Google, GitHub, dll).",
      parameters: [
        {
          name: "provider",
          in: "path",
          required: true,
          description: "Nama OAuth provider",
          schema: { type: "string", enum: ["google", "github"], example: "google" },
        },
      ],
      responses: {
        302: { description: "Redirect ke halaman login OAuth provider" },
        400: {
          description: "Provider tidak valid",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
      },
    },
  },

  // ── GET /v1/auth/:provider/callback ─────────────────────────
  "/v1/auth/{provider}/callback": {
    get: {
      tags: ["Auth"],
      summary: "OAuth callback handler",
      description: "Endpoint callback dari OAuth provider. Jangan dipanggil langsung — ini dihandle provider.",
      parameters: [
        {
          name: "provider",
          in: "path",
          required: true,
          schema: { type: "string", enum: ["google", "github"], example: "google" },
        },
        {
          name: "code",
          in: "query",
          required: false,
          description: "Authorization code dari provider",
          schema: { type: "string" },
        },
        {
          name: "state",
          in: "query",
          required: false,
          description: "State untuk CSRF protection",
          schema: { type: "string" },
        },
        {
          name: "error",
          in: "query",
          required: false,
          description: "Error dari provider jika user cancel",
          schema: { type: "string", example: "access_denied" },
        },
      ],
      responses: {
        302: { description: "Redirect ke client setelah OAuth selesai (sukses atau gagal)" },
      },
    },
  },
};
