import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendMailDto } from '@app/common';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  sendMail(@Body() dto: SendMailDto) {
    return this.notificationsService.sendMail();
  }
}
