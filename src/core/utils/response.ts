import { TranslationUtil } from './translations';

/**
 * Standard API Response Format
 *
 * All API responses follow this consistent structure:
 * - status: "success" | "error"
 * - message: Human-readable message (translated)
 * - lang: Language code (e.g., "en", "ar")
 * - timestamp: ISO 8601 timestamp
 * - data: The response payload (null for errors)
 */

export type ResponseStatus = 'success' | 'error';

export interface StandardResponse<T> {
  status: ResponseStatus;
  message: string;
  lang: string;
  timestamp: string;
  data: T | null;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
  isNextPage: boolean;
  isPrevPage: boolean;
}

/**
 * Wrapped data structure for single item responses
 */
export interface SingleItemData<T> {
  data: T;
}

/**
 * Wrapped data structure for array responses with pagination
 */
export interface ArrayDataWithMeta<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Utility class for standardizing API responses.
 */
export class ResponseUtil {
  /**
   * Get language from request (defaults to 'en')
   */
  private static getLang(lang?: string): string {
    return lang || 'en';
  }

  /**
   * Translate message key or use provided message
   */
  private static translateMessage(message: string, lang: string): string {
    // If message looks like a translation key (contains dots), try to translate it
    if (message.includes('.') && !message.includes(' ')) {
      const translated = TranslationUtil.translate(message, lang);
      // If translation was found (not the key itself), return it
      if (translated !== message) {
        return translated;
      }
    }
    // Otherwise, return the message as-is (already translated or plain text)
    return message;
  }

  /**
   * Returns a standardized success response for a single item.
   * Wraps the data in { data: T } structure.
   *
   * @typeParam T - The type of the data being returned.
   * @param data - The payload data to return.
   * @param message - A human-readable success message (defaults to `'Success'`).
   * @param lang - The language code for the message (defaults to `'en'`).
   * @param wrap - Whether to wrap data in { data: T } structure (defaults to true).
   * @returns A StandardResponse with wrapped or unwrapped data structure.
   *
   * @example
   * ```ts
   * ResponseUtil.successSingle({ id: 1, name: "John" }, "User retrieved successfully", "en")
   * // Returns: { status: "success", message: "...", lang: "en", timestamp: "...", data: { data: { id: 1, name: "John" } } }
   *
   * ResponseUtil.successSingle({ user: {...}, token: "..." }, "Registered successfully", "en", false)
   * // Returns: { status: "success", message: "...", lang: "en", timestamp: "...", data: { user: {...}, token: "..." } }
   * ```
   */
  static successSingle<T>(
    data: T,
    message: string = 'common.success',
    lang?: string,
    wrap: boolean = true,
  ): StandardResponse<SingleItemData<T> | T | null> {
    const language = this.getLang(lang);

    // If data is null or undefined, return null directly (don't wrap)
    if (data === null || data === undefined) {
      return {
        status: 'success',
        message: this.translateMessage(message, language),
        lang: language,
        timestamp: new Date().toISOString(),
        data: null,
      };
    }

    return {
      status: 'success',
      message: this.translateMessage(message, language),
      lang: language,
      timestamp: new Date().toISOString(),
      data: wrap ? ({ data } as SingleItemData<T>) : (data as T),
    };
  }

  /**
   * Returns a standardized success response for an array with pagination metadata.
   * Wraps the data in { data: T[], meta: PaginationMeta } structure.
   *
   * @typeParam T - The type of items in the array.
   * @param data - Array of items.
   * @param total - Total number of items (not just in this page).
   * @param page - Current page number (1-indexed).
   * @param limit - Number of items per page.
   * @param message - A human-readable success message (defaults to `'Success'`).
   * @param lang - The language code for the message (defaults to `'en'`).
   * @returns A StandardResponse with wrapped array and pagination metadata.
   *
   * @example
   * ```ts
   * ResponseUtil.successList([user1, user2], 100, 1, 10, "Users retrieved successfully", "en")
   * // Returns: { status: "success", message: "...", lang: "en", timestamp: "...", data: { data: [...], meta: { page: 1, total: 100, limit: 10, totalPages: 10, isNextPage: true, isPrevPage: false } } }
   * ```
   */
  static successList<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'common.success',
    lang?: string,
  ): StandardResponse<ArrayDataWithMeta<T>> {
    const language = this.getLang(lang);
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      total,
      limit,
      totalPages,
      isNextPage: page < totalPages,
      isPrevPage: page > 1,
    };

    return {
      status: 'success',
      message: this.translateMessage(message, language),
      lang: language,
      timestamp: new Date().toISOString(),
      data: {
        data,
        meta,
      },
    };
  }

  /**
   * Returns a standardized success response.
   * Automatically detects if data is an array and applies appropriate wrapping.
   * For arrays, you should use successList() for pagination support.
   * For single items, wraps in { data: T } structure.
   *
   * @typeParam T - The type of the data being returned.
   * @param data - The payload data to return (optional).
   * @param message - A human-readable success message (defaults to `'Success'`).
   * @param lang - The language code for the message (defaults to `'en'`).
   * @returns A StandardResponse with appropriate data structure.
   *
   * @example
   * ```ts
   * ResponseUtil.success({ id: 1, name: "John" }, "User created", "en")
   * ```
   */
  static success<T>(
    data?: T,
    message: string = 'common.success',
    lang?: string,
  ): StandardResponse<SingleItemData<T> | ArrayDataWithMeta<T> | T | null> {
    const language = this.getLang(lang);
    const translatedMessage = this.translateMessage(message, language);

    // If data is undefined or null, return null in data field
    if (data === undefined || data === null) {
      return {
        status: 'success',
        message: translatedMessage,
        lang: language,
        timestamp: new Date().toISOString(),
        data: null,
      };
    }

    // If data is an array, wrap with meta (but without pagination info - use successList for that)
    if (Array.isArray(data)) {
      return {
        status: 'success',
        message: translatedMessage,
        lang: language,
        timestamp: new Date().toISOString(),
        data: {
          data,
          meta: {
            page: 1,
            total: data.length,
            limit: data.length,
            totalPages: 1,
            isNextPage: false,
            isPrevPage: false,
          },
        },
      };
    }

    // For single items, wrap in { data: T }
    return this.successSingle(data, message, lang);
  }

  /**
   * Returns a standardized error response.
   *
   * @param message - A human-readable error message (defaults to `'Error'`).
   * @param lang - The language code for the message (defaults to `'en'`).
   * @returns A StandardResponse with null data and error status.
   *
   * @example
   * ```ts
   * ResponseUtil.error("User not found", "en")
   * // Returns: { status: "error", message: "User not found", lang: "en", timestamp: "...", data: null }
   * ```
   */
  static error(
    message: string = 'common.error',
    lang?: string,
  ): StandardResponse<null> {
    const language = this.getLang(lang);
    return {
      status: 'error',
      message: this.translateMessage(message, language),
      lang: language,
      timestamp: new Date().toISOString(),
      data: null,
    };
  }
}
