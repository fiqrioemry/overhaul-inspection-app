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
  data?: T;
}

export interface ResponseOK {
  success: boolean;
  message: string;
}
