export default interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}
