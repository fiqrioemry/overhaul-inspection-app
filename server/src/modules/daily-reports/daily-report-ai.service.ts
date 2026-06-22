import { HTTPException } from "hono/http-exception";
import { getOpenAIClient } from "@/lib/openai";
import { openaiConfig } from "@/config/env";
import { pgsql } from "@/lib/database";
import { sanitizeHtml } from "@/utils/sanitize-html";

const ACTIVITY_LABELS: Record<string, string> = {
  MONITORING: "Monitoring Rutin",
  INSPECTION: "Inspeksi Teknis",
};

const LOCATION_LABELS: Record<string, string> = {
  SUNGAI_GERONG: "Sungai Gerong",
  PLADJU: "Pladju",
};

export interface AIGenerateInput {
  files: File[];
  activityType: string;
  tankId?: string;
  processName?: string;
  location?: string;
  descriptionDraft?: string;
  recommendationDraft?: string;
}

export interface AIGenerateResult {
  /** HTML bullet list ready for the rich editor */
  description: string;
  /** HTML bullet list ready for the rich editor, or null when no recommendation applies */
  recommendation: string | null;
  captions: string[];
  relevanceWarning: boolean;
  confidence?: number;
  notes?: string[];
}

function buildSystemPrompt(
  activityType: string,
  tank: { tankNo: string; tankName: string | null; location: string | null; service: string | null; capacityM3: number | null } | null,
  processName: string | undefined,
  location: string | undefined,
  descriptionDraft: string | undefined,
  recommendationDraft: string | undefined,
): string {
  const lines = [
    "Kamu adalah asisten AI untuk mendokumentasikan kegiatan inspeksi dan overhaul tangki penyimpanan minyak bumi di depot Pertamina Patra Niaga.",
    "",
    "KONTEKS PEKERJAAN:",
    tank ? `- Nomor Tangki: ${tank.tankNo}` : "- Kegiatan umum (tidak terkait tangki tertentu)",
    tank?.tankName ? `- Nama Tangki: ${tank.tankName}` : null,
    tank?.location ? `- Lokasi: ${LOCATION_LABELS[tank.location] ?? tank.location}` : location ? `- Lokasi: ${LOCATION_LABELS[location] ?? location}` : null,
    tank?.service ? `- Produk/Service: ${tank.service.replace(/_/g, " ")}` : null,
    tank?.capacityM3 ? `- Kapasitas: ${tank.capacityM3} m³` : null,
    processName ? `- Proses Pekerjaan: ${processName}` : null,
    `- Jenis Kegiatan: ${ACTIVITY_LABELS[activityType] ?? activityType}`,
    "",
    "DRAFT DARI USER (gunakan sebagai konteks utama, jangan ubah maknanya):",
    `- Draft Uraian Kegiatan: ${descriptionDraft?.trim() || "(kosong)"}`,
    `- Draft Rekomendasi: ${recommendationDraft?.trim() || "(kosong)"}`,
    "",
    "TUGAS:",
    "1. Analisis setiap foto yang diberikan secara teknis.",
    "2. Buat URAIAN KEGIATAN (description) dalam bahasa Indonesia, formal dan teknis, sebagai daftar poin.",
    "3. Buat REKOMENDASI (recommendation) dalam bahasa Indonesia sebagai daftar poin.",
    "   - Jika draft rekomendasi user tersedia, JADIKAN itu sebagai dasar utama dan rapikan bahasanya tanpa mengubah makna.",
    "   - Jika draft rekomendasi kosong, boleh menyusun rekomendasi konservatif berdasarkan foto/konteks.",
    "   - Jika tidak ada rekomendasi yang relevan, set recommendation ke null.",
    "4. Buat CAPTION singkat untuk SETIAP foto (maksimal 15 kata, teknis dan deskriptif). Jumlah caption HARUS sama dengan jumlah foto.",
    "5. Set relevanceWarning ke true JIKA foto tidak berhubungan dengan kegiatan inspeksi/konstruksi/overhaul tangki industri.",
    "",
    "ATURAN PENTING:",
    "- JANGAN membuat temuan baru yang tidak terlihat di foto atau tidak disebut user.",
    "- Boleh memperbaiki bahasa agar lebih formal, teknis, dan jelas.",
    "- Boleh menambahkan detail umum yang aman dan relevan (mis. 'perlu dilakukan pembersihan area kerja').",
    "- JANGAN menambahkan acceptance criteria atau standar tertentu jika tidak diberikan.",
    "- JANGAN menyatakan pekerjaan 'accepted', 'rejected', atau 'passed' kecuali jelas disebutkan user.",
    "- Jika foto tidak cukup jelas, gunakan bahasa hati-hati seperti 'perlu dilakukan verifikasi visual lanjutan'.",
    "",
    "FORMAT OUTPUT description & recommendation:",
    "- HARUS berupa HTML bullet list yang valid: <ul><li>poin pertama</li><li>poin kedua</li></ul>",
    "- Setiap poin adalah satu kalimat singkat. Maksimal 8 poin.",
    "- Tanpa teks pembuka/penutup di luar <ul>.",
    "- description tidak boleh kosong. recommendation boleh null.",
    "",
    "FORMAT RESPONS (JSON valid):",
    "{",
    '  "description": "<ul><li>...</li></ul>",',
    '  "recommendation": "<ul><li>...</li></ul>",',
    '  "captions": ["caption foto 1", "caption foto 2"],',
    '  "relevanceWarning": false,',
    '  "confidence": 0.0,',
    '  "notes": []',
    "}",
  ];

  return lines.filter((l) => l !== null).join("\n");
}

/** Coerce arbitrary model text into safe HTML bullet markup for the rich editor. */
function toBulletHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Already HTML list-ish — just sanitize.
  if (/<ul|<ol|<li|<p/i.test(trimmed)) return sanitizeHtml(trimmed);
  // Plain text (possibly newline/bullet separated) → build a <ul>.
  const items = trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter(Boolean);
  if (items.length === 0) return null;
  const li = items.map((i) => `<li>${i.replace(/[<>&]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[m]!))}</li>`).join("");
  return `<ul>${li}</ul>`;
}

export class DailyReportAIService {
  static async generate(input: AIGenerateInput): Promise<AIGenerateResult> {
    const { files, activityType, tankId, processName, location, descriptionDraft, recommendationDraft } = input;
    if (files.length === 0) {
      throw new HTTPException(400, { message: "Minimal satu foto diperlukan untuk generate AI" });
    }

    // tankId is optional: general daily reports are documented without tank context.
    let tank: { tankNo: string; tankName: string | null; location: string | null; service: string | null; capacityM3: number | null } | null = null;
    if (tankId) {
      tank = await pgsql.tank.findUnique({
        where: { id: tankId },
        select: { tankNo: true, tankName: true, location: true, service: true, capacityM3: true },
      });
      if (!tank) throw new HTTPException(404, { message: "Tank not found" });
    }

    const imageContents = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          type: "image_url" as const,
          image_url: {
            url: `data:${file.type};base64,${base64}`,
            detail: "low" as const,
          },
        };
      }),
    );

    const systemPrompt = buildSystemPrompt(activityType, tank, processName, location, descriptionDraft, recommendationDraft);

    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: openaiConfig.MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Ini adalah ${files.length} foto dari kegiatan ${ACTIVITY_LABELS[activityType] ?? activityType}${tank ? ` pada tangki ${tank.tankNo}` : ""}. Buat uraian kegiatan, rekomendasi, dan caption untuk setiap foto (total ${files.length} caption).`,
            },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(raw) as {
        description?: string;
        recommendation?: string | null;
        captions?: string[];
        relevanceWarning?: boolean;
        confidence?: number;
        notes?: string[];
      };

      const description = toBulletHtml(parsed.description) ?? "<ul><li>Dokumentasi kegiatan inspeksi harian.</li></ul>";
      const recommendation = toBulletHtml(parsed.recommendation ?? null);

      return {
        description,
        recommendation,
        captions: parsed.captions?.length ? parsed.captions : files.map((_, i) => `Foto dokumentasi ${i + 1}`),
        relevanceWarning: parsed.relevanceWarning ?? false,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
        notes: Array.isArray(parsed.notes) ? parsed.notes : undefined,
      };
    } catch {
      throw new HTTPException(500, { message: "Gagal memproses respons AI" });
    }
  }
}
