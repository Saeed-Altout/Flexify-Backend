import type { Request } from 'express';

/**
 * Utility functions for extracting information from HTTP requests.
 */
export class RequestUtil {
  /**
   * Extracts the language code from the request headers.
   * Checks Accept-Language header and falls back to 'en' if not found.
   *
   * @param req Express request object
   * @returns Language code ('en' or 'ar')
   */
  static getLanguage(req: Request): string {
    const acceptLanguage = req.headers['accept-language'];
    
    if (!acceptLanguage) {
      return 'en';
    }

    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ar;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const parts = lang.trim().split(';');
        const code = parts[0].toLowerCase().split('-')[0]; // Get base language code
        const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
        return { code, quality };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first supported language
    for (const lang of languages) {
      if (lang.code === 'ar' || lang.code === 'en') {
        return lang.code;
      }
    }

    return 'en';
  }
}

