import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SiteSettingsService } from './site-settings.service';
import { CreateNavbarLinkDto } from './dto/create-navbar-link.dto';
import { UpdateNavbarLinkDto } from './dto/update-navbar-link.dto';
import {
  UpdateSiteSettingDto,
  UpdateSiteSettingTranslationDto,
} from './dto/update-site-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ResponseUtil,
  StandardResponse,
  SingleItemData,
} from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  // =====================================================
  // NAVBAR LINKS
  // =====================================================

  @Get('navbar-links')
  async getNavbarLinks(@Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const locale = req.query.locale as string;
    const links = await this.siteSettingsService.getNavbarLinks(locale);
    return ResponseUtil.successList(
      links,
      links.length,
      1,
      links.length,
      'siteSettings.navbarLinks.fetchSuccess',
      lang,
    );
  }

  @Get('navbar-links/all')
  @UseGuards(JwtAuthGuard)
  async getAllNavbarLinks(@Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const links = await this.siteSettingsService.getAllNavbarLinks();
    return ResponseUtil.successList(
      links,
      links.length,
      1,
      links.length,
      'siteSettings.navbarLinks.fetchSuccess',
      lang,
    );
  }

  @Post('navbar-links')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createNavbarLink(
    @Body() createDto: CreateNavbarLinkDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const link = await this.siteSettingsService.createNavbarLink(createDto);
    return ResponseUtil.successSingle(
      link,
      'siteSettings.navbarLinks.createSuccess',
      lang,
    );
  }

  @Patch('navbar-links/:id')
  @UseGuards(JwtAuthGuard)
  async updateNavbarLink(
    @Param('id') id: string,
    @Body() updateDto: UpdateNavbarLinkDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const link = await this.siteSettingsService.updateNavbarLink(id, updateDto);
    return ResponseUtil.successSingle(
      link,
      'siteSettings.navbarLinks.updateSuccess',
      lang,
    );
  }

  @Delete('navbar-links/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNavbarLink(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<StandardResponse<SingleItemData<null> | null>> {
    const lang = RequestUtil.getLanguage(req);
    await this.siteSettingsService.deleteNavbarLink(id);
    return ResponseUtil.successSingle(
      null,
      'siteSettings.navbarLinks.deleteSuccess',
      lang,
    );
  }

  // =====================================================
  // SITE SETTINGS (GitHub, Hero, Statistics, About, Footer)
  // =====================================================

  @Get('settings/:key')
  async getSiteSetting(
    @Param('key') key: string,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const locale = req.query.locale as string;
    const setting = await this.siteSettingsService.getSiteSetting(key, locale);
    return ResponseUtil.successSingle(
      setting,
      'siteSettings.setting.fetchSuccess',
      lang,
    );
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getAllSiteSettings(
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const settings = await this.siteSettingsService.getAllSiteSettings();
    return ResponseUtil.successList(
      settings,
      settings.length,
      1,
      settings.length,
      'siteSettings.settings.fetchSuccess',
      lang,
    );
  }

  @Patch('settings/:key')
  @UseGuards(JwtAuthGuard)
  async updateSiteSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSiteSettingDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const setting = await this.siteSettingsService.updateSiteSetting(
      key,
      updateDto,
    );
    return ResponseUtil.successSingle(
      setting,
      'siteSettings.setting.updateSuccess',
      lang,
    );
  }

  @Patch('settings/:key/translations')
  @UseGuards(JwtAuthGuard)
  async updateSiteSettingTranslation(
    @Param('key') key: string,
    @Body() translationDto: UpdateSiteSettingTranslationDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const setting = await this.siteSettingsService.updateSiteSettingTranslation(
      key,
      translationDto,
    );
    return ResponseUtil.successSingle(
      setting,
      'siteSettings.setting.translationUpdateSuccess',
      lang,
    );
  }

  // =====================================================
  // CV UPLOAD
  // =====================================================

  @Post('cv/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCV(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<
    StandardResponse<
      | SingleItemData<{ url: string; fileName: string }>
      | { url: string; fileName: string }
      | null
    >
  > {
    const lang = RequestUtil.getLanguage(req);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const cvUrl = await this.siteSettingsService.uploadCV(file);
    const cvSetting = await this.siteSettingsService.getSiteSetting('cv');
    const cvValue = cvSetting.value as { url: string; fileName: string };

    return ResponseUtil.successSingle(
      { url: cvUrl, fileName: cvValue.fileName },
      'siteSettings.cv.uploadSuccess',
      lang,
      false,
    );
  }
}
