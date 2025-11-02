import * as fs from 'fs';
import * as path from 'path';

export class TranslationUtil {
  private static translations: { [key: string]: any } = {};
  private static initialized = false;

  private static initialize() {
    if (this.initialized) return;

    try {
      // Try multiple paths for translation files
      const possiblePaths = [
        path.join(__dirname, '../../i18n/en.json'), // For development
        path.join(__dirname, '../../../src/i18n/en.json'), // For compiled dist
        path.join(process.cwd(), 'src/i18n/en.json'), // From project root
        path.join(process.cwd(), 'dist/i18n/en.json'), // From dist
      ];

      let enPath: string | null = null;
      let arPath: string | null = null;

      // Find existing translation files
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          enPath = possiblePath;
          arPath = possiblePath.replace('en.json', 'ar.json');
          break;
        }
      }

      if (enPath && fs.existsSync(enPath)) {
        const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        this.translations['en'] = enTranslations;
      }

      if (arPath && fs.existsSync(arPath)) {
        const arTranslations = JSON.parse(fs.readFileSync(arPath, 'utf8'));
        this.translations['ar'] = arTranslations;
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to empty translations
      this.translations['en'] = {};
      this.translations['ar'] = {};
      this.initialized = true;
    }
  }

  static translate(key: string, lang: string = 'en'): string {
    this.initialize();

    const language = lang.toLowerCase();
    const translations = this.translations[language] || this.translations['en'];

    return translations[key] || key;
  }

  static getTranslations(lang: string = 'en'): { [key: string]: string } {
    this.initialize();

    const language = lang.toLowerCase();
    return this.translations[language] || this.translations['en'];
  }
}
