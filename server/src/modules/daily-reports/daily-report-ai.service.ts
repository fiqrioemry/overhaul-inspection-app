import { HTTPException } from "hono/http-exception";
import { getOpenAIClient } from "@/lib/openai";
import { openaiConfig } from "@/config/env";
import { pgsql } from "@/lib/database";

const ACTIVITY_LABELS: Record<string, string> = {
  MONITORING: "Monitoring Rutin",
  INSPECTION: "Inspeksi Teknis",
};

const LOCATION_LABELS: Record<string, string> = {
  SUNGAI_GERONG: "Sungai Gerong",
  PLADJU: "Pladju",
};

export interface AIGenerateResult {
  description: string;
  captions: string[];
  relevanceWarning: boolean;
}

function buildSystemPrompt(
  activityType: string,
  tank: { tankNo: string; tankName: string | null; location: string | null; service: string | null; capacityM3: number | null },
  processName?: string,
): string {
  const lines = [
    "Kamu adalah asisten AI untuk mendokumentasikan kegiatan inspeksi dan overhaul tangki penyimpanan minyak bumi di depot Pertamina Patra Niaga.",
    "",
    "KONTEKS PEKERJAAN:",
    `- Nomor Tangki: ${tank.tankNo}`,
    tank.tankName ? `- Nama Tangki: ${tank.tankName}` : null,
    tank.location ? `- Lokasi: ${LOCATION_LABELS[tank.location] ?? tank.location}` : null,
    tank.service ? `- Produk/Service: ${tank.service.replace(/_/g, " ")}` : null,
    tank.capacityM3 ? `- Kapasitas: ${tank.capacityM3} m³` : null,
    processName ? `- Proses Pekerjaan: ${processName}` : null,
    `- Jenis Kegiatan: ${ACTIVITY_LABELS[activityType] ?? activityType}`,
    "",
    "TUGAS:",
    "1. Analisis setiap foto yang diberikan secara teknis.",
    "2. Buat URAIAN KEGIATAN dalam bahasa Indonesia sebagai DAFTAR POIN (bullet list).",
    "   - Format: setiap poin diawali dengan tanda '• ' (bullet + spasi)",
    "   - Maksimal 8 poin, masing-masing singkat dan langsung pada inti kegiatan (1 kalimat per poin)",
    "   - Gunakan terminologi teknis inspeksi/overhaul tangki yang tepat",
    "   - Tidak perlu kalimat pembuka atau penutup, langsung ke daftar poin",
    "   - Contoh format:",
    "     • Pemeriksaan visual kondisi shell plate pada course 1 dan course 2",
    "     • Pengukuran ketebalan dinding tangki menggunakan ultrasonic thickness gauge",
    "3. Buat CAPTION singkat untuk SETIAP foto (maksimal 15 kata, dalam bahasa Indonesia, teknis dan deskriptif).",
    "   - Jumlah caption HARUS sama dengan jumlah foto yang dikirimkan",
    "4. JIKA foto-foto TIDAK berhubungan dengan kegiatan inspeksi/konstruksi/overhaul tangki industri (misalnya: foto makanan, selfie, pemandangan umum, hewan, dll), set relevanceWarning ke true.",
    "",
    "FORMAT RESPONS (JSON valid):",
    '{',
    '  "description": "• Poin pertama\\n• Poin kedua\\n• Poin ketiga",',
    '  "captions": ["caption foto 1", "caption foto 2"],',
    '  "relevanceWarning": false',
    '}',
  ];

  return lines.filter((l) => l !== null).join("\n");
}

export class DailyReportAIService {
  static async generate(
    files: File[],
    activityType: string,
    tankId: string,
    processName?: string,
  ): Promise<AIGenerateResult> {
    if (files.length === 0) {
      throw new HTTPException(400, { message: "Minimal satu foto diperlukan untuk generate AI" });
    }

    const tank = await pgsql.tank.findUnique({
      where: { id: tankId },
      select: { tankNo: true, tankName: true, location: true, service: true, capacityM3: true },
    });
    if (!tank) throw new HTTPException(404, { message: "Tank not found" });

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

    const systemPrompt = buildSystemPrompt(activityType, tank, processName);

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
              text: `Ini adalah ${files.length} foto dari kegiatan ${ACTIVITY_LABELS[activityType] ?? activityType} pada tangki ${tank.tankNo}. Buat uraian kegiatan dan caption untuk setiap foto (total ${files.length} caption).`,
            },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 2500,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(raw) as {
        description?: string;
        captions?: string[];
        relevanceWarning?: boolean;
      };

      return {
        description: parsed.description ?? "",
        captions: parsed.captions?.length
          ? parsed.captions
          : files.map((_, i) => `Foto dokumentasi ${i + 1}`),
        relevanceWarning: parsed.relevanceWarning ?? false,
      };
    } catch {
      throw new HTTPException(500, { message: "Gagal memproses respons AI" });
    }
  }
}
