export interface Meta {
  pagination?: PaginationMeta;
  filter?: FilterMeta;
}
export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface FilterMeta {
  orderBy: string;
  sortBy: "asc" | "desc";
  search?: string;
  tags?: string[];
}
