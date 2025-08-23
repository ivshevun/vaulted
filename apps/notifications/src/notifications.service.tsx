import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailDto } from '@app/common';
import { Resend } from 'resend';
import { FileInfectedTemplate } from './email-templates';
import React from 'react';

@Injectable()
export class NotificationsService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const API_KEY = configService.get<string>('RESEND_API_KEY')!;

    this.resend = new Resend(API_KEY);
  }

  async sendMail(dto: SendMailDto) {
    const { data, error } = await this.resend.emails.send({
      from: 'Vaulted Notifications <notifications@vaulted.digital>',
      to: [dto.to],
      subject: 'File infected',
      react: <FileInfectedTemplate filename="virus.txt" username="ivshevun" />,
    });

    if (error) {
      throw new BadRequestException(error);
    }

    return data;
  }
}
