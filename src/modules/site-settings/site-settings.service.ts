import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateNavbarLinkDto } from './dto/create-navbar-link.dto';
import { UpdateNavbarLinkDto } from './dto/update-navbar-link.dto';
import {
  UpdateSiteSettingDto,
  UpdateSiteSettingTranslationDto,
} from './dto/update-site-setting.dto';
import { INavbarLink, ISiteSetting } from './types/site-settings.types';

@Injectable()
export class SiteSettingsService extends BaseService {
  // =====================================================
  // NAVBAR LINKS
  // =====================================================

  /**
   * Get all navbar links with translations
   */
  async getNavbarLinks(locale?: string): Promise<INavbarLink[]> {
    const supabase = this.getClient();

    const { data: links, error } = await supabase
      .from('navbar_links')
      .select('*, navbar_link_translations(*)')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      throw new BadRequestException('siteSettings.navbarLinks.fetchFailed');
    }

    if (!links) {
      return [];
    }

    // Filter translations by locale if provided
    return links.map((link) => ({
      id: link.id,
      href: link.href,
      icon: link.icon,
      orderIndex: link.order_index,
      isActive: link.is_active,
      createdAt: link.created_at,
      updatedAt: link.updated_at,
      translations: locale
        ? link.navbar_link_translations?.filter((t) => t.locale === locale)
        : link.navbar_link_translations,
    })) as INavbarLink[];
  }

  /**
   * Get all navbar links (for admin)
   */
  async getAllNavbarLinks(): Promise<INavbarLink[]> {
    const supabase = this.getClient();

    const { data: links, error } = await supabase
      .from('navbar_links')
      .select('*, navbar_link_translations(*)')
      .order('order_index', { ascending: true });

    if (error) {
      throw new BadRequestException('siteSettings.navbarLinks.fetchFailed');
    }

    if (!links) {
      return [];
    }

    return links.map((link) => ({
      id: link.id,
      href: link.href,
      icon: link.icon,
      orderIndex: link.order_index,
      isActive: link.is_active,
      createdAt: link.created_at,
      updatedAt: link.updated_at,
      translations: link.navbar_link_translations,
    })) as INavbarLink[];
  }

  /**
   * Create a new navbar link
   */
  async createNavbarLink(createDto: CreateNavbarLinkDto): Promise<INavbarLink> {
    const supabase = this.getClient();

    if (!createDto.translations || createDto.translations.length === 0) {
      throw new BadRequestException(
        'siteSettings.navbarLinks.translationsRequired',
      );
    }

    // Create navbar link
    const { data: link, error: linkError } = await supabase
      .from('navbar_links')
      .insert({
        href: createDto.href,
        icon: createDto.icon || null,
        order_index: createDto.orderIndex || 0,
        is_active: createDto.isActive !== undefined ? createDto.isActive : true,
      })
      .select()
      .single();

    if (linkError || !link) {
      throw new BadRequestException('siteSettings.navbarLinks.createFailed');
    }

    // Create translations
    const translationsData = createDto.translations.map((t) => ({
      navbar_link_id: link.id,
      locale: t.locale,
      label: t.label,
    }));

    const { error: translationsError } = await supabase
      .from('navbar_link_translations')
      .insert(translationsData);

    if (translationsError) {
      // Rollback
      await supabase.from('navbar_links').delete().eq('id', link.id);
      throw new BadRequestException(
        'siteSettings.navbarLinks.translationsFailed',
      );
    }

    return this.getNavbarLinkById(link.id);
  }

  /**
   * Get navbar link by ID
   */
  async getNavbarLinkById(id: string): Promise<INavbarLink> {
    const supabase = this.getClient();

    const { data: link, error } = await supabase
      .from('navbar_links')
      .select('*, navbar_link_translations(*)')
      .eq('id', id)
      .single();

    if (error || !link) {
      throw new NotFoundException('siteSettings.navbarLinks.notFound');
    }

    return {
      id: link.id,
      href: link.href,
      icon: link.icon,
      orderIndex: link.order_index,
      isActive: link.is_active,
      createdAt: link.created_at,
      updatedAt: link.updated_at,
      translations: link.navbar_link_translations,
    } as INavbarLink;
  }

  /**
   * Update navbar link
   */
  async updateNavbarLink(
    id: string,
    updateDto: UpdateNavbarLinkDto,
  ): Promise<INavbarLink> {
    const supabase = this.getClient();

    // Check if link exists
    await this.getNavbarLinkById(id);

    // Update link
    const updateData: any = {};
    if (updateDto.href !== undefined) updateData.href = updateDto.href;
    if (updateDto.icon !== undefined) updateData.icon = updateDto.icon;
    if (updateDto.orderIndex !== undefined)
      updateData.order_index = updateDto.orderIndex;
    if (updateDto.isActive !== undefined)
      updateData.is_active = updateDto.isActive;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('navbar_links')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new BadRequestException('siteSettings.navbarLinks.updateFailed');
      }
    }

    // Update translations if provided
    if (updateDto.translations && updateDto.translations.length > 0) {
      // Delete existing translations
      await supabase
        .from('navbar_link_translations')
        .delete()
        .eq('navbar_link_id', id);

      // Insert new translations
      const translationsData = updateDto.translations.map((t) => ({
        navbar_link_id: id,
        locale: t.locale,
        label: t.label,
      }));

      const { error: translationsError } = await supabase
        .from('navbar_link_translations')
        .insert(translationsData);

      if (translationsError) {
        throw new BadRequestException(
          'siteSettings.navbarLinks.translationsFailed',
        );
      }
    }

    return this.getNavbarLinkById(id);
  }

  /**
   * Delete navbar link
   */
  async deleteNavbarLink(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if link exists
    await this.getNavbarLinkById(id);

    const { error } = await supabase.from('navbar_links').delete().eq('id', id);

    if (error) {
      throw new BadRequestException('siteSettings.navbarLinks.deleteFailed');
    }
  }

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
