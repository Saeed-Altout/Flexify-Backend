import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported languages for internationalization.
 */
export type SupportedLang = 'en' | 'ar';

/**
 * The shape of an individual translations dictionary.
 */
export type TranslationDict = Record<string, string>;

/**
 * The global translation storage.
 */
export type GlobalTranslations = Record<SupportedLang, TranslationDict>;

/**
 * An advanced utility class for loading and retrieving i18n translations.
 *
 * Translation files are loaded once per run for efficiency.
 * Files should be named en.json/ar.json and located in 'i18n' under project, dist, or src.
 *
 * Example usage:
 *  const translated = TranslationUtil.translate('hello_key', 'ar');
 *  const allEn = TranslationUtil.getTranslations('en');
 */
export class TranslationUtil {
  /**
   * Storage for loaded translations. Lazy-loaded on first use.
   */
  private static translations: GlobalTranslations = { en: {}, ar: {} };

  /**
   * Flag to indicate if translation files were loaded.
   */
  private static initialized: boolean = false;

  /**
   * Resolve the absolute path to a translation file for a specific language.
   * @param lang The language code ('en' or 'ar')
   */
  private static resolveTranslationFilePath(
    lang: SupportedLang,
  ): string | null {
    const fileName = `${lang}.json`;
    const possiblePaths = [
      path.join(__dirname, '../../i18n', fileName), // For development
      path.join(__dirname, '../../../src/i18n', fileName), // For compiled dist
      path.join(process.cwd(), 'src/i18n', fileName), // From project root
      path.join(process.cwd(), 'dist/i18n', fileName), // From dist
    ];
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }
    return null;
  }

  /**
   * Initialize translations by loading the translation files.
   * Only executes once per application run.
   */
  private static initialize(): void {
    if (this.initialized) return;

    (['en', 'ar'] as const).forEach((lang) => {
      const filePath = this.resolveTranslationFilePath(lang);
      if (filePath) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          this.translations[lang] = JSON.parse(content) as TranslationDict;
        } catch {
          // If translation file fails to load, use empty dict
          this.translations[lang] = {};
        }
      } else {
        this.translations[lang] = {};
      }
    });

    this.initialized = true;
  }

  /**
   * Translate a key into the given language.
   * Falls back to English and then to the key if missing.
   *
   * @param key The key to translate.
   * @param lang The language code (default 'en').
   * @returns The translated string, or the key if not found.
   */
  static translate(key: string, lang: string = 'en'): string {
    this.initialize();
    const language = lang.toLowerCase() as SupportedLang;
    const fallbackLang: SupportedLang = 'en';
    const translation =
      this.translations[language]?.[key] ??
      this.translations[fallbackLang]?.[key] ??
      key;
    return translation;
  }

  /**
   * Retrieve the entire translation dictionary for the specified language.
   * Falls back to English if not found.
   *
   * @param lang Language code (default 'en').
   * @returns A dictionary mapping translation keys to values.
   */
  static getTranslations(lang: string = 'en'): TranslationDict {
    this.initialize();
    const language = lang.toLowerCase() as SupportedLang;
    return this.translations[language] || this.translations['en'] || {};
  }

  /**
   * Reload translation files from disk in case of changes.
   */
  static reloadTranslations(): void {
    this.initialized = false;
    this.initialize();
  }
}
