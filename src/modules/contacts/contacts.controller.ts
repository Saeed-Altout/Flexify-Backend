import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { ReplyContactDto } from './dto/reply-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateContactDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const contact = await this.contactsService.create(createDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(contact, 'contacts.create.success', lang);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() queryDto: QueryContactDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.contactsService.findAll(queryDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successList(
      result.contacts,
      result.total,
      result.page,
      result.limit,
      'contacts.findAll.success',
      lang,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const contact = await this.contactsService.findOne(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(contact, 'contacts.findOne.success', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateContactDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const contact = await this.contactsService.update(id, updateDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(contact, 'contacts.update.success', lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.contactsService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'contacts.delete.success', lang);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reply(
    @Param('id') id: string,
    @Body() replyDto: ReplyContactDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.contactsService.reply(id, replyDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'contacts.reply.success', lang);
  }
}

