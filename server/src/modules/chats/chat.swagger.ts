// Schema & path definitions untuk module chats
// Diimport dan di-merge ke spec di docs.route.ts

export const chatSchemas = {
  // ── Sub-schemas ──────────────────────────────────────────────
  ChatParticipant: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_participant_123" },
      userId: { type: "string", example: "cuid_user_123" },
      role: { type: "string", enum: ["MEMBER", "ADMIN"], example: "MEMBER" },
      joinedAt: { type: "string", format: "date-time" },
      user: {
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

  LastMessage: {
    type: "object",
    nullable: true,
    properties: {
      id: { type: "string", example: "cuid_msg_123" },
      text: { type: "string", example: "Hey, how are you?" },
      type: { type: "string", enum: ["text", "image", "file", "audio"], example: "text" },
      senderId: { type: "string", example: "cuid_user_123" },
      createdAt: { type: "string", format: "date-time" },
      sender: {
        type: "object",
        properties: {
          id: { type: "string", example: "cuid_user_123" },
          name: { type: "string", example: "John Doe" },
          username: { type: "string", example: "johndoe_x7k" },
        },
      },
    },
  },

  MessageItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_msg_123" },
      chatId: { type: "string", example: "cuid_chat_123" },
      senderId: { type: "string", example: "cuid_user_123" },
      type: { type: "string", enum: ["text", "image", "file", "audio"], example: "text" },
      text: { type: "string", example: "Hey, how are you?" },
      mediaUrl: { type: "string", format: "uri", nullable: true },
      readBy: {
        type: "array",
        items: { type: "string" },
        example: ["cuid_user_123", "cuid_user_456"],
        description: "Daftar userId yang sudah membaca pesan ini",
      },
      createdAt: { type: "string", format: "date-time" },
      sender: {
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

  ChatListItem: {
    type: "object",
    properties: {
      id: { type: "string", example: "cuid_chat_123" },
      type: { type: "string", enum: ["PRIVATE", "GROUP"], example: "PRIVATE" },
      name: { type: "string", nullable: true, example: "Engineering Team" },
      avatar: { type: "string", format: "uri", nullable: true },
      description: { type: "string", nullable: true, example: "Group for engineering discussions" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      unreadCount: { type: "integer", example: 3 },
      lastMessage: { $ref: "#/components/schemas/LastMessage" },
      participants: {
        type: "array",
        items: { $ref: "#/components/schemas/ChatParticipant" },
      },
      _count: {
        type: "object",
        properties: {
          participants: { type: "integer", example: 5 },
          messages: { type: "integer", example: 120 },
        },
      },
    },
  },

  ChatDetail: {
    allOf: [
      { $ref: "#/components/schemas/ChatListItem" },
      {
        type: "object",
        properties: {
          createdById: { type: "string", nullable: true, example: "cuid_user_123" },
        },
      },
    ],
  },

  // ── Request bodies ───────────────────────────────────────────
  CreatePrivateChatRequest: {
    type: "object",
    required: ["targetUserId"],
    properties: {
      targetUserId: {
        type: "string",
        example: "cuid_user_456",
        description: "ID user yang ingin diajak chat. Jika chat sudah ada, mengembalikan chat yang existing.",
      },
    },
  },

  CreateGroupChatRequest: {
    type: "object",
    required: ["name", "memberIds"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 80, example: "Engineering Team" },
      description: { type: "string", maxLength: 200, nullable: true, example: "Group for engineering discussions" },
      memberIds: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 99,
        example: ["cuid_user_456", "cuid_user_789"],
        description: "Minimal 2 member lain selain creator. Creator otomatis jadi ADMIN.",
      },
    },
  },

  SendMessageRequest: {
    type: "object",
    required: ["text"],
    properties: {
      text: { type: "string", minLength: 1, maxLength: 2000, example: "Hey, how are you?" },
      type: {
        type: "string",
        enum: ["text", "image", "file", "audio"],
        default: "text",
        description: "Tipe pesan. Jika bukan text, sertakan file di field `media`.",
      },
      media: {
        type: "string",
        format: "binary",
        description: "File attachment. Max 5MB. Format: JPEG/PNG/WebP/PDF/MP4/MPEG/DOCX/XLSX",
      },
    },
  },

  UpdateGroupRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 80, example: "New Group Name" },
      description: { type: "string", maxLength: 200, example: "Updated description" },
    },
  },

  AddMembersRequest: {
    type: "object",
    required: ["userIds"],
    properties: {
      userIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 50,
        example: ["cuid_user_456", "cuid_user_789"],
        description: "Daftar userId yang ingin ditambahkan. User yang sudah ada di group akan dilewati.",
      },
    },
  },

  RemoveMemberRequest: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: {
        type: "string",
        example: "cuid_user_456",
        description: "ID member yang ingin dikeluarkan. Tidak bisa remove ADMIN atau diri sendiri.",
      },
    },
  },

  PromoteDemoteMemberRequest: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: {
        type: "string",
        example: "cuid_user_456",
        description: "ID member yang ingin dipromote/demote.",
      },
    },
  },

  ReadMessagesRequest: {
    type: "object",
    required: ["messageIds"],
    properties: {
      messageIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        example: ["cuid_msg_123", "cuid_msg_456"],
        description: "Daftar ID pesan yang ingin ditandai sudah dibaca.",
      },
    },
  },

  DeleteMessagesRequest: {
    type: "object",
    required: ["messageIds"],
    properties: {
      messageIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        example: ["cuid_msg_123", "cuid_msg_456"],
        description: "Hanya bisa menghapus pesan milik sendiri.",
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

export const chatPaths = {
  // ── GET /v1/chats ────────────────────────────────────────────
  "/v1/chats": {
    get: {
      tags: ["Chats"],
      summary: "Ambil daftar chat",
      description: "Mengembalikan semua chat (private & group) milik user yang sedang login, diurutkan by `updatedAt desc`. Setiap chat menyertakan `unreadCount`.",
      security,
      parameters: [
        { name: "page", in: "query", schema: { type: "string", default: "1" } },
        { name: "limit", in: "query", schema: { type: "string", default: "20" } },
      ],
      responses: {
        200: {
          description: "Daftar chat berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Get chats successful" },
                  data: { type: "array", items: { $ref: "#/components/schemas/ChatListItem" } },
                  meta: {
                    type: "object",
                    properties: {
                      totalItems: { type: "integer", example: 10 },
                      totalPages: { type: "integer", example: 1 },
                      currentPage: { type: "integer", example: 1 },
                    },
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

  // ── GET /v1/chats/unread-count ───────────────────────────────
  "/v1/chats/unread-count": {
    get: {
      tags: ["Chats"],
      summary: "Ambil total pesan belum dibaca",
      description: "Mengembalikan total pesan belum dibaca di semua chat milik user. Cocok untuk badge counter di navigation.",
      security,
      responses: {
        200: {
          description: "Total unread messages berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Count unread messages successful" },
                  data: {
                    type: "object",
                    properties: {
                      unreadCount: { type: "integer", example: 12 },
                    },
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

  // ── POST /v1/chats/private ───────────────────────────────────
  "/v1/chats/private": {
    post: {
      tags: ["Chats"],
      summary: "Buat private chat",
      description: "Membuat private chat 1-on-1 dengan user lain. Jika chat antara dua user sudah ada, mengembalikan chat yang existing daripada membuat duplikat.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/CreatePrivateChatRequest" } },
        },
      },
      responses: {
        200: {
          description: "Private chat berhasil dibuat atau ditemukan",
          content: dataResponse("ChatDetail", "Create private chat successful"),
        },
        400: { description: "Tidak bisa chat dengan diri sendiri", content: errorContent },
        401: unauthorizedRef,
        404: { description: "User target tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/chats/group ─────────────────────────────────────
  "/v1/chats/group": {
    post: {
      tags: ["Chats"],
      summary: "Buat group chat",
      description: "Membuat group chat baru. Creator otomatis jadi ADMIN. Membutuhkan minimal 2 member lain (total 3 orang termasuk creator), maksimal 100 orang.",
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/CreateGroupChatRequest" } },
        },
      },
      responses: {
        200: {
          description: "Group chat berhasil dibuat",
          content: dataResponse("ChatDetail", "Create group chat successful"),
        },
        400: { description: "Jumlah member tidak valid atau melebihi batas", content: errorContent },
        401: unauthorizedRef,
        404: { description: "Satu atau lebih user tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/chats/:chatId ────────────────────────────────────
  "/v1/chats/{chatId}": {
    get: {
      tags: ["Chats"],
      summary: "Ambil detail chat",
      description: "Mengembalikan detail lengkap sebuah chat beserta semua participant dan `unreadCount`. User harus menjadi participant chat tersebut.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      responses: {
        200: {
          description: "Detail chat berhasil diambil",
          content: dataResponse("ChatDetail", "Get chat successful"),
        },
        401: unauthorizedRef,
        403: { description: "Bukan participant chat ini", content: errorContent },
        404: { description: "Chat tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── GET /v1/chats/:chatId/messages ───────────────────────────
  "/v1/chats/{chatId}/messages": {
    get: {
      tags: ["Chats"],
      summary: "Ambil pesan dalam chat",
      description: "Mengembalikan pesan dalam chat dengan cursor-based pagination. Gunakan `cursor` (message ID terakhir) untuk load pesan lebih lama. Pesan diurutkan `createdAt desc`.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
        {
          name: "cursor",
          in: "query",
          schema: { type: "string" },
          description: "ID pesan terakhir yang sudah di-load untuk mengambil pesan lebih lama (cursor-based pagination)",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "string", default: "30" },
          description: "Jumlah pesan per request",
        },
      ],
      responses: {
        200: {
          description: "Pesan berhasil diambil",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Get messages successful" },
                  data: { type: "array", items: { $ref: "#/components/schemas/MessageItem" } },
                  meta: {
                    type: "object",
                    properties: {
                      pagination: {
                        type: "object",
                        properties: {
                          hasMore: { type: "boolean", example: true },
                          nextCursor: {
                            type: "string",
                            nullable: true,
                            example: "cuid_msg_001",
                            description: "ID pesan untuk request berikutnya. null jika tidak ada lagi.",
                          },
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
        403: { description: "Bukan participant chat ini", content: errorContent },
        404: { description: "Chat tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },

    // ── POST /v1/chats/:chatId/messages ────────────────────────
    post: {
      tags: ["Chats"],
      summary: "Kirim pesan",
      description:
        "Mengirim pesan ke dalam chat. Mendukung pesan teks dan attachment file (image/file/audio, max 5MB). Pesan di-broadcast ke semua participant via WebSocket (`chat:{chatId}` channel, event `NEW_MESSAGE`). Notifikasi in-app dikirim ke participant yang offline.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": { schema: { $ref: "#/components/schemas/SendMessageRequest" } },
        },
      },
      responses: {
        200: {
          description: "Pesan berhasil dikirim",
          content: dataResponse("MessageItem", "Send message successful"),
        },
        400: { description: "Validasi gagal atau tipe file tidak didukung", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan participant chat ini", content: errorContent },
        404: { description: "Chat tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },

    // ── DELETE /v1/chats/:chatId/messages ──────────────────────
    delete: {
      tags: ["Chats"],
      summary: "Hapus pesan",
      description: "Menghapus satu atau lebih pesan secara permanen. Hanya bisa menghapus pesan milik sendiri. File attachment terkait juga ikut dihapus.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/DeleteMessagesRequest" } },
        },
      },
      responses: {
        200: {
          description: "Pesan berhasil dihapus",
          content: simpleOK("Delete messages successful"),
        },
        401: unauthorizedRef,
        403: { description: "Bukan participant chat ini", content: errorContent },
        404: { description: "Chat atau pesan tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/chats/:chatId/messages/read ────────────────────
  "/v1/chats/{chatId}/messages/read": {
    patch: {
      tags: ["Chats"],
      summary: "Tandai pesan sebagai sudah dibaca",
      description: "Menandai satu atau lebih pesan sebagai sudah dibaca. Broadcast via WebSocket event `MESSAGE_READ` ke semua participant.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ReadMessagesRequest" } },
        },
      },
      responses: {
        200: {
          description: "Pesan berhasil ditandai dibaca",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Read messages successful" },
                  data: {
                    type: "object",
                    properties: {
                      updatedCount: { type: "integer", example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: unauthorizedRef,
        403: { description: "Bukan participant chat ini", content: errorContent },
        404: { description: "Chat tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/chats/:chatId/group ────────────────────────────
  "/v1/chats/{chatId}/group": {
    patch: {
      tags: ["Chats"],
      summary: "Update info group",
      description: "Mengupdate nama dan/atau deskripsi group. Hanya ADMIN yang bisa melakukan ini. Broadcast via WebSocket event `GROUP_UPDATED`.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdateGroupRequest" } },
        },
      },
      responses: {
        200: {
          description: "Info group berhasil diupdate",
          content: dataResponse("ChatDetail", "Update group successful"),
        },
        400: { description: "Bukan group chat atau validasi gagal", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan ADMIN group ini", content: errorContent },
        404: { description: "Chat tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── POST /v1/chats/:chatId/members ───────────────────────────
  "/v1/chats/{chatId}/members": {
    post: {
      tags: ["Chats"],
      summary: "Tambah member ke group",
      description: "Menambahkan satu atau lebih user ke group. Hanya ADMIN. User yang sudah ada di group dilewati. Maksimal 100 total participant. Broadcast event `PARTICIPANT_JOINED` per user baru.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/AddMembersRequest" } },
        },
      },
      responses: {
        200: {
          description: "Member berhasil ditambahkan",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "integer", example: 200 },
                  message: { type: "string", example: "Add members successful" },
                  data: { type: "array", items: { $ref: "#/components/schemas/ChatParticipant" } },
                },
              },
            },
          },
        },
        400: { description: "Bukan group atau kapasitas penuh", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan ADMIN group ini", content: errorContent },
        404: { description: "Chat atau user tidak ditemukan", content: errorContent },
        409: { description: "Semua user yang dicantumkan sudah ada di group", content: errorContent },
        429: tooManyRef,
      },
    },

    // ── DELETE /v1/chats/:chatId/members ───────────────────────
    delete: {
      tags: ["Chats"],
      summary: "Keluarkan member dari group",
      description: "Mengeluarkan satu member dari group. Hanya ADMIN. Tidak bisa mengeluarkan diri sendiri atau sesama ADMIN. Broadcast event `PARTICIPANT_LEFT`.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/RemoveMemberRequest" } },
        },
      },
      responses: {
        200: {
          description: "Member berhasil dikeluarkan",
          content: simpleOK("Remove member successful"),
        },
        400: { description: "Mencoba remove diri sendiri atau ADMIN", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan ADMIN group ini", content: errorContent },
        404: { description: "Chat atau participant tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── DELETE /v1/chats/:chatId/leave ───────────────────────────
  "/v1/chats/{chatId}/leave": {
    delete: {
      tags: ["Chats"],
      summary: "Keluar dari group",
      description: "User keluar dari group secara mandiri. Jika user adalah satu-satunya ADMIN, group otomatis dihapus. Broadcast event `PARTICIPANT_LEFT`.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      responses: {
        200: {
          description: "Berhasil keluar dari group",
          content: simpleOK("Leave group successful"),
        },
        400: { description: "Bukan group chat", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan participant group ini", content: errorContent },
        404: { description: "Chat tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/chats/:chatId/members/promote ──────────────────
  "/v1/chats/{chatId}/members/promote": {
    patch: {
      tags: ["Chats"],
      summary: "Promote member menjadi ADMIN",
      description: "Menaikan role member menjadi ADMIN. Hanya ADMIN yang bisa melakukan ini.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/PromoteDemoteMemberRequest" } },
        },
      },
      responses: {
        200: {
          description: "Member berhasil di-promote",
          content: simpleOK("Promote member successful"),
        },
        400: { description: "Bukan group chat", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan ADMIN group ini", content: errorContent },
        404: { description: "Chat atau participant tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },

  // ── PATCH /v1/chats/:chatId/members/demote ───────────────────
  "/v1/chats/{chatId}/members/demote": {
    patch: {
      tags: ["Chats"],
      summary: "Demote ADMIN menjadi member",
      description: "Menurunkan role ADMIN menjadi MEMBER. Hanya ADMIN. Tidak bisa demote diri sendiri.",
      security,
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string", example: "cuid_chat_123" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/PromoteDemoteMemberRequest" } },
        },
      },
      responses: {
        200: {
          description: "ADMIN berhasil di-demote",
          content: simpleOK("Demote member successful"),
        },
        400: { description: "Mencoba demote diri sendiri atau bukan group chat", content: errorContent },
        401: unauthorizedRef,
        403: { description: "Bukan ADMIN group ini", content: errorContent },
        404: { description: "Chat atau participant tidak ditemukan", content: errorContent },
        429: tooManyRef,
      },
    },
  },
};
