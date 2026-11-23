export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Định dạng response thành công của backend. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}
