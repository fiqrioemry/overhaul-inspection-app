import { HTTPException } from "hono/http-exception";
import { getOpenAIClient } from "@/lib/openai";
import { openaiConfig } from "@/config/env";
import { TankLocationEnum, TankServiceEnum } from "generated/prisma";

const TANK_LOCATION_VALUES = Object.values(TankLocationEnum);
const TANK_SERVICE_VALUES = Object.values(TankServiceEnum);

// Document mime types we can feed to the vision/OCR model.
const PDF_MIME = "application/pdf";
const IMAGE_MIME_PREFIX = "image/";

export interface TankShellCourseExtract {
  courseNo: number;
  thicknessMm?: number;
  plateDimension?: string;
  remarks?: string;
}

export interface TankExtractResult {
  tankNo: string | null;
  tankName: string | null;
  location: TankLocationEnum | null;
  capacityM3: number | null;
  service: TankServiceEnum | null;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number | null;
  bottomPlateDimension: string | null;
  hasSteamCoil: boolean | null;
  startDate: string | null;
  estimatedFinishDate: string | null;
  shellCourses: TankShellCourseExtract[];
  relevanceWarning: boolean;
}

function buildSystemPrompt(): string {
  return [
    "Kamu adalah asisten AI OCR untuk mengekstrak data spesifikasi tangki penyimpanan minyak bumi dari dokumen teknis (datasheet, spesifikasi, atau gambar tangki) di depot Pertamina Patra Niaga.",
    "",
    "TUGAS:",
    "Baca dokumen yang diberikan, lakukan OCR jika perlu, lalu ekstrak data spesifikasi tangki dan kembalikan dalam format JSON valid.",
    "",
    "FIELD YANG DIEKSTRAK:",
    "- tankNo: nomor tangki (contoh: \"TK-170\"). Wajib dicari.",
    "- tankName: nama/deskripsi tangki, null jika tidak ada.",
    `- location: lokasi depot. HANYA boleh salah satu dari [${TANK_LOCATION_VALUES.join(", ")}], atau null jika tidak jelas.`,
    "- capacityM3: kapasitas tangki dalam meter kubik (angka saja, tanpa satuan).",
    "- diameterMm: diameter tangki dalam milimeter (konversi dari meter jika perlu).",
    "- heightMm: tinggi tangki dalam milimeter (konversi dari meter jika perlu).",
    `- service: produk/service yang disimpan. HANYA boleh salah satu dari [${TANK_SERVICE_VALUES.join(", ")}], atau null jika tidak jelas. Petakan istilah umum ke enum (mis. \"Solar/Diesel\" -> SOLAR, \"Avtur/Jet A-1\" -> AVTUR).`,
    "- shellCourseCount: jumlah shell course/ring plate dinding tangki (angka).",
    "- bottomPlateDimension: dimensi pelat dasar, null jika tidak ada.",
    "- hasSteamCoil: true jika dokumen menyebut adanya steam coil, false jika dinyatakan tidak ada, null jika tidak disebut.",
    "- startDate: tanggal mulai pekerjaan format YYYY-MM-DD, null jika tidak ada.",
    "- estimatedFinishDate: estimasi tanggal selesai format YYYY-MM-DD, null jika tidak ada.",
    "- shellCourses: array detail shell course jika tersedia, masing-masing { courseNo (number, mulai 1), thicknessMm (number, opsional), plateDimension (string, opsional), remarks (string, opsional) }. Kosongkan array jika tidak ada.",
    "",
    "ATURAN:",
    "1. Jangan mengarang nilai. Jika sebuah field tidak ditemukan di dokumen, set null (atau array kosong untuk shellCourses).",
    "2. Konversi semua dimensi panjang ke milimeter dan kapasitas ke m3.",
    "3. JIKA dokumen TIDAK berhubungan dengan spesifikasi tangki industri (mis. dokumen acak, foto pribadi, invoice tidak relevan), set relevanceWarning ke true dan field lain null.",
    "",
    "FORMAT RESPONS (JSON valid, tanpa teks tambahan):",
    "{",
    '  "tankNo": "TK-170",',
    '  "tankName": null,',
    '  "location": "SUNGAI_GERONG",',
    '  "capacityM3": 5000,',
    '  "diameterMm": 18000,',
    '  "heightMm": 12000,',
    '  "service": "SOLAR",',
    '  "shellCourseCount": 6,',
    '  "bottomPlateDimension": null,',
    '  "hasSteamCoil": false,',
    '  "startDate": null,',
    '  "estimatedFinishDate": null,',
    '  "shellCourses": [{ "courseNo": 1, "thicknessMm": 12 }],',
    '  "relevanceWarning": false',
    "}",
  ].join("\n");
}

function coerceEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return (allowed as string[]).includes(upper) ? (upper as T) : null;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
}

export class TankAIService {
  static async extract(files: File[]): Promise<TankExtractResult> {
    if (files.length === 0) {
      throw new HTTPException(400, { message: "Minimal satu dokumen diperlukan untuk ekstraksi AI", cause: "AI_NO_FILE" });
    }

    const contents = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        if (file.type.startsWith(IMAGE_MIME_PREFIX)) {
          return {
            type: "image_url" as const,
            image_url: { url: `data:${file.type};base64,${base64}`, detail: "high" as const },
          };
        }

        if (file.type === PDF_MIME) {
          return {
            type: "file" as const,
            file: { filename: file.name, file_data: `data:${PDF_MIME};base64,${base64}` },
          };
        }

        throw new HTTPException(400, {
          message: `Tipe dokumen "${file.type}" tidak didukung untuk ekstraksi AI. Gunakan PDF atau gambar (JPG/PNG).`,
          cause: "AI_UNSUPPORTED_FILE_TYPE",
        });
      }),
    );

    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: openaiConfig.MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Ekstrak data spesifikasi tangki dari ${files.length} dokumen berikut dan kembalikan JSON sesuai format.`,
            },
            ...contents,
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new HTTPException(500, { message: "Gagal memproses respons AI", cause: "AI_PARSE_ERROR" });
    }

    const shellCoursesRaw = Array.isArray(parsed.shellCourses) ? (parsed.shellCourses as unknown[]) : [];
    const shellCourses: TankShellCourseExtract[] = shellCoursesRaw
      .map((sc, idx) => {
        const obj = (sc ?? {}) as Record<string, unknown>;
        const courseNo = coerceNumber(obj.courseNo) ?? idx + 1;
        return {
          courseNo: Math.max(1, Math.round(courseNo)),
          thicknessMm: coerceNumber(obj.thicknessMm) ?? undefined,
          plateDimension: coerceString(obj.plateDimension) ?? undefined,
          remarks: coerceString(obj.remarks) ?? undefined,
        };
      })
      .filter((sc) => Number.isFinite(sc.courseNo));

    return {
      tankNo: coerceString(parsed.tankNo),
      tankName: coerceString(parsed.tankName),
      location: coerceEnum(parsed.location, TANK_LOCATION_VALUES as TankLocationEnum[]),
      capacityM3: coerceNumber(parsed.capacityM3),
      service: coerceEnum(parsed.service, TANK_SERVICE_VALUES as TankServiceEnum[]),
      diameterMm: coerceNumber(parsed.diameterMm),
      heightMm: coerceNumber(parsed.heightMm),
      shellCourseCount: coerceNumber(parsed.shellCourseCount),
      bottomPlateDimension: coerceString(parsed.bottomPlateDimension),
      hasSteamCoil: typeof parsed.hasSteamCoil === "boolean" ? parsed.hasSteamCoil : null,
      startDate: coerceString(parsed.startDate),
      estimatedFinishDate: coerceString(parsed.estimatedFinishDate),
      shellCourses,
      relevanceWarning: parsed.relevanceWarning === true,
    };
  }
}
