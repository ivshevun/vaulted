import { Injectable } from '@nestjs/common';

@Injectable()
export class AntivirusService {
  getHello(): string {
    return 'Hello World!';
  }
}
