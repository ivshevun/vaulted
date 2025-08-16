import { Injectable } from '@nestjs/common';
import mail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { EmailType, SendMailDto } from '@app/common';

@Injectable()
export class NotificationsService {
  constructor(private readonly configService: ConfigService) {
    const API_KEY = configService.get<string>('SENDGRID_API_KEY')!;

    mail.setApiKey(API_KEY);
  }

  async sendMail(dto: SendMailDto) {
    const subjectAndHtml = this.getSubjectAndHtml(dto.emailType);

    const message = {
      to: dto.to,
      from: 'notifications@vaulted.digital', // TODO: use config service
      ...subjectAndHtml,
    };
    await mail.send(message);

    return true;
  }

  private getSubjectAndHtml(emailType: EmailType) {
    const emailContents = {
      'file-infected': {
        subject: 'Your file was denied: infection detected',
        html: '<p>Infection detected</p>',
      },
    };

    return emailContents[emailType];
  }
}
