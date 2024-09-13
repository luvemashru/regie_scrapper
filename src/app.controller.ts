import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ScraperResponseDto } from './app.dto';

@Controller('/scrapeData')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<ScraperResponseDto> {
    return await this.appService.fetchData()
  }
}
