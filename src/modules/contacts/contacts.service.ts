import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import {
  QueryContactDto,
  ContactSortBy,
  SortOrder,
} from './dto/query-contact.dto';
import { ReplyContactDto } from './dto/reply-contact.dto';
import { IContact, IContactsListResponse } from './types/contact.types';
import { ContactStatus } from './enums/contact-status.enum';
import { MailerService } from '../mailer/mailer.service';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Injectable()
export class ContactsService extends BaseService {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;

  constructor(
    protected readonly supabaseService: SupabaseService,
    private readonly mailerService: MailerService,
  ) {
    super(supabaseService);
  }

  /**
   * Create a new contact
   */
  async create(createDto: CreateContactDto): Promise<IContact> {
    const supabase = this.getClient();

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        name: createDto.name,
        email: createDto.email,
        phone: createDto.phone || null,
        subject: createDto.subject || null,
        message: createDto.message,
        status: createDto.status || ContactStatus.NEW,
        inquiry_type_id: createDto.inquiryTypeId || null,
      })
      .select(
        `
        *,
        inquiryType:inquiry_types(
          id,
          slug,
          translations:inquiry_type_translations(locale, name)
        )
      `,
      )
      .single();

    if (error || !contact) {
      throw new BadRequestException('contacts.create.failed');
    }

    return this.mapToContact(contact);
  }

  /**
   * Find all contacts with filters and pagination
   */
  async findAll(queryDto: QueryContactDto): Promise<IContactsListResponse> {
    const supabase = this.getClient();
    const {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
      search,
      status,
      inquiryTypeId,
      sortBy = ContactSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    let query = supabase.from('contacts').select(
      `
        *,
        inquiryType:inquiry_types(
          id,
          slug,
          translations:inquiry_type_translations(locale, name)
        )
      `,
      { count: 'exact' },
    );

    // Search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`,
      );
    }

    // Status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Inquiry type filter
    if (inquiryTypeId) {
      query = query.eq('inquiry_type_id', inquiryTypeId);
    }

    // Sort
    const ascending = sortOrder === SortOrder.ASC;
    query = query.order(sortBy, { ascending });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException('contacts.findAll.failed');
    }

    const contacts = (data || []).map((item) => this.mapToContact(item));

    return {
      contacts,
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Find one contact by ID
   */
  async findOne(id: string): Promise<IContact> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('contacts')
      .select(
        `
        *,
        inquiryType:inquiry_types(
          id,
          slug,
          translations:inquiry_type_translations(locale, name)
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('contacts.findOne.notFound');
    }

    return this.mapToContact(data);
  }

  /**
   * Update a contact
   */
  async update(id: string, updateDto: UpdateContactDto): Promise<IContact> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.email !== undefined) updateData.email = updateDto.email;
    if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
    if (updateDto.subject !== undefined) updateData.subject = updateDto.subject;
    if (updateDto.message !== undefined) updateData.message = updateDto.message;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.inquiryTypeId !== undefined)
      updateData.inquiry_type_id = updateDto.inquiryTypeId;

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new BadRequestException('contacts.update.failed');
    }

    return this.findOne(id);
  }

  /**
   * Delete a contact
   */
  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const { error } = await supabase.from('contacts').delete().eq('id', id);

    if (error) {
      throw new BadRequestException('contacts.delete.failed');
    }
  }

  /**
   * Reply to a contact
   */
  async reply(id: string, replyDto: ReplyContactDto): Promise<void> {
    const contact = await this.findOne(id);

    // Send reply email
    await this.mailerService.sendContactReplyEmail(contact.email, {
      contactName: contact.name,
      originalSubject: contact.subject,
      originalMessage: contact.message,
      replyMessage: replyDto.message,
      replySubject: replyDto.subject,
    });

    // Update contact status to 'replied'
    await this.update(id, { status: ContactStatus.REPLIED });
  }

  /**
   * Map database row to IContact
   */
  private mapToContact(data: any): IContact {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      status: data.status,
      inquiryTypeId: data.inquiry_type_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      inquiryType: data.inquiryType
        ? {
            id: data.inquiryType.id,
            slug: data.inquiryType.slug,
            translations: data.inquiryType.translations || [],
          }
        : undefined,
    };
  }
}
