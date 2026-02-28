export interface PaginatedRequest {
  page?: number;
  pageSize?: number; // 25 | 50 | 100
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filters?: Record<string, string | string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal" | "ticket";
  title: string;
  subtitle: string;
}
