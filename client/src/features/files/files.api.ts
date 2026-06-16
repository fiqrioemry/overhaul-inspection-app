// src/features/files/files.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export interface FileRecord {
  id: string;
  url: string;
  path: string;
  module: string;
  isUsed: boolean;
  createdAt: string;
}

export async function uploadFile(file: File, module?: string): Promise<FileRecord> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ResponseSuccess<FileRecord>>("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params: module ? { module } : undefined,
  });
  return res.data.data!;
}

export async function getFileById(id: string): Promise<FileRecord> {
  const res = await api.get<ResponseSuccess<FileRecord>>(`/files/${id}`);
  return res.data.data!;
}
