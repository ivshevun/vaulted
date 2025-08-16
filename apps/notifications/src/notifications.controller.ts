import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendMailDto } from '@app/common';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async sendMail(@Body() dto: SendMailDto) {
    return await this.notificationsService.sendMail(dto);
  }
}
