export type PaginateQueryResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};
