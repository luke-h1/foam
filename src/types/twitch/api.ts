export interface PaginatedList<T> {
  data: T[];
  pagination?: {
    cursor: string;
  };
  total?: number;
}
