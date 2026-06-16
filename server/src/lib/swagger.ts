export const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "Overhaul Inspection & Monitoring API",
    version: "3.2.0",
    description: "API for Overhaul Inspection & Monitoring system built with Hono and Bun",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: process.env.SERVER_URL || "http://localhost:5000",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Session token dari response login",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session_token", // sesuaikan dengan TOKEN_PREFIX_DEFAULT kamu
      },
    },
    schemas: {}, // diisi dari masing-masing module
    responses: {
      UnauthorizedError: {
        description: "Token tidak valid atau tidak ada",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      ValidationError: {
        description: "Request body tidak valid",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      TooManyRequests: {
        description: "Rate limit tercapai",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Autentikasi, manajemen sesi & Two-Factor Authentication (2FA)" },
    { name: "Users", description: "Manajemen user, profil, follow, block, mute & pencarian" },
    { name: "Posts", description: "Manajemen post, like, bookmark & laporan" },
    { name: "Notifications", description: "Manajemen notifikasi & badge count" },
    { name: "Comments", description: "Manajemen komentar & like komentar" },
    { name: "Chats", description: "Manajemen chat pribadi & grup" },
    { name: "Hashtags", description: "Trending hashtag & post by hashtag" },
    { name: "Admin", description: "Panel admin — manajemen user, laporan & statistik platform" },
  ],
  paths: {} as Record<string, unknown>, // diisi dari masing-masing module
};
