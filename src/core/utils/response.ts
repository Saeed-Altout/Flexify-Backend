import { ApiResponse } from 'src/common/types/response.type';

/**
 * Utility class for standardizing API responses.
 */
export class ResponseUtil {
  /**
   * Returns a standardized success response.
   *
   * @typeParam T - The type of the data being returned.
   * @param data - The payload data to return (optional).
   * @param message - A human-readable success message (defaults to `'Success'`).
   * @param lang - The language code for the message, if applicable (optional).
   * @returns An ApiResponse<T> object representing a successful response.
   *
   * @example
   * ```ts
   * ResponseUtil.success({ id: 1, name: "John" }, "User created", "en")
   * ```
   */
  static success<T>(
    data?: T,
    message: string = 'Success',
    lang?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data: data ?? undefined,
      lang: lang ?? undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns a standardized error response.
   *
   * @param message - A human-readable error message (defaults to `'Error'`).
   * @param error - Detailed error information or object (optional).
   * @param lang - The language code for the message, if applicable (optional).
   * @returns An ApiResponse<void> object representing an error/failure.
   *
   * @example
   * ```ts
   * ResponseUtil.error("Not found", { code: 404 }, "en")
   * ```
   */
  static error(
    message: string = 'Error',
    error?: string | object,
    lang?: string,
  ): ApiResponse<void> {
    return {
      success: false,
      message,
      error: error ?? undefined,
      lang: lang ?? undefined,
      timestamp: new Date().toISOString(),
    };
  }
}
