import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import {
  UpdateSiteSettingDto,
  UpdateSiteSettingTranslationDto,
} from './dto/update-site-setting.dto';
import { ISiteSetting } from './types/site-settings.types';

@Injectable()
export class SiteSettingsService extends BaseService {
  // =====================================================
  // SITE SETTINGS (GitHub, Hero, Statistics, About, Footer)
  // =====================================================

  /**
   * Get site setting by key
   */
  async getSiteSetting(key: string, locale?: string): Promise<ISiteSetting> {
    const supabase = this.getClient();

    const { data: setting, error } = await supabase
      .from('site_settings')
      .select('*, site_setting_translations(*)')
      .eq('key', key)
      .single();

    if (error || !setting) {
      throw new NotFoundException('siteSettings.setting.notFound');
    }

    return {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at,
      translations: locale
        ? setting.site_setting_translations?.filter((t) => t.locale === locale)
        : setting.site_setting_translations,
    } as ISiteSetting;
  }

  /**
   * Update site setting
   */
  async updateSiteSetting(
    key: string,
    updateDto: UpdateSiteSettingDto,
  ): Promise<ISiteSetting> {
    const supabase = this.getClient();

    // Check if setting exists
    const existing = await this.getSiteSetting(key);

    // Update setting
    if (updateDto.value !== undefined) {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: updateDto.value })
        .eq('key', key);

      if (error) {
        throw new BadRequestException('siteSettings.setting.updateFailed');
      }
    }

    return this.getSiteSetting(key);
  }

  /**
   * Update site setting translation
   */
  async updateSiteSettingTranslation(
    key: string,
    translationDto: UpdateSiteSettingTranslationDto,
  ): Promise<ISiteSetting> {
    const supabase = this.getClient();

    // Get setting
    const setting = await this.getSiteSetting(key);

    // Check if translation exists
    const { data: existingTranslation } = await supabase
      .from('site_setting_translations')
      .select('id')
      .eq('site_setting_id', setting.id)
      .eq('locale', translationDto.locale)
      .single();

    if (existingTranslation) {
      // Update existing translation
      const { error } = await supabase
        .from('site_setting_translations')
        .update({ value: translationDto.value })
        .eq('id', existingTranslation.id);

      if (error) {
        throw new BadRequestException(
          'siteSettings.setting.translationUpdateFailed',
        );
      }
    } else {
      // Create new translation
      const { error } = await supabase
        .from('site_setting_translations')
        .insert({
          site_setting_id: setting.id,
          locale: translationDto.locale,
          value: translationDto.value,
        });

      if (error) {
        throw new BadRequestException(
          'siteSettings.setting.translationCreateFailed',
        );
      }
    }

    return this.getSiteSetting(key, translationDto.locale);
  }

  /**
   * Get all site settings (for admin)
   */
  async getAllSiteSettings(): Promise<ISiteSetting[]> {
    const supabase = this.getClient();

    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*, site_setting_translations(*)')
      .order('key', { ascending: true });

    if (error) {
      throw new BadRequestException('siteSettings.settings.fetchFailed');
    }

    if (!settings) {
      return [];
    }

    return settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at,
      translations: setting.site_setting_translations,
    })) as ISiteSetting[];
  }

  // =====================================================
  // CV UPLOAD
  // =====================================================

  /**
   * Upload CV file
   */
  async uploadCV(file: Express.Multer.File): Promise<string> {
    const supabase = this.getClient();

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('siteSettings.cv.invalidFileType');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('siteSettings.cv.fileTooLarge');
    }

    // Generate unique filename
    const fileExt = 'pdf';
    const fileName = `cv-${Date.now()}.${fileExt}`;
    const filePath = `cv/${fileName}`;

    // Delete old CV if exists
    const { data: oldFiles } = await supabase.storage
      .from('cv-files')
      .list('cv', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (oldFiles && oldFiles.length > 0) {
      // Delete all old CV files
      const oldFilePaths = oldFiles.map((f) => `cv/${f.name}`);
      await supabase.storage.from('cv-files').remove(oldFilePaths);
    }

    // Upload new CV
    const { error: uploadError } = await supabase.storage
      .from('cv-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException('siteSettings.cv.uploadFailed');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cv-files')
      .getPublicUrl(filePath);
    const cvUrl = urlData.publicUrl;

    // Update CV setting with new URL and filename
    const { data: cvSetting } = await supabase
      .from('site_settings')
      .select('id, value')
      .eq('key', 'cv')
      .single();

    if (cvSetting) {
      const currentValue = cvSetting.value as { url: string; fileName: string };
      await supabase
        .from('site_settings')
        .update({
          value: {
            url: cvUrl,
            fileName: file.originalname || 'CV.pdf',
          },
        })
        .eq('key', 'cv');
    } else {
      // Create CV setting if it doesn't exist
      await supabase.from('site_settings').insert({
        key: 'cv',
        value: {
          url: cvUrl,
          fileName: file.originalname || 'CV.pdf',
        },
      });
    }

    return cvUrl;
  }
}
