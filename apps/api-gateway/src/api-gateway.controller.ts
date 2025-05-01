import { Controller, Get, Inject } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject('auth')
    private readonly authClient: ClientProxy,
    private readonly apiGatewayService: ApiGatewayService,
  ) {}

  @Get('ping')
  ping() {
    return this.authClient.send('ping', {});
  }
}
