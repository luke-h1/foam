export interface PaginatedList<T> {
  data: T[];
  pagination?:
    | {
        cursor: string;
      }
    | undefined;
  total?: number;
}
