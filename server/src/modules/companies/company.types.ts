export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CompanyItem {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyOption {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface CompanyListResult {
  data: CompanyItem[];
  meta: PaginationMeta;
}
