import type { Meta } from "@/types/pagination.type";

export interface ResponseError {
  success?: boolean;
  message: string;
  status?: number;
  code?: string;
  errors?: Record<string, string>;
}

export interface ResponseSuccess<T> {
  success: boolean;
  message: string;
  status: number;
  data?: T;
  meta?: Meta;
}

export interface ResponseOK {
  success: boolean;
  message: string;
  status: number;
}
