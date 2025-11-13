export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
  lang?: string;
  timestamp: string;
};
