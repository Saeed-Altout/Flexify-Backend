export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
  lang?: string;
  timestamp: string;
}

export class ResponseUtil {
  static success<T>(
    data?: T,
    message: string = 'Success',
    lang?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      lang,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string,
    error?: string | object,
    lang?: string,
  ): ApiResponse {
    return {
      success: false,
      message,
      error,
      lang,
      timestamp: new Date().toISOString(),
    };
  }
}
