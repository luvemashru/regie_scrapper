import { Controller, Post, Get, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ScraperResponseDto } from './app.dto';
import { VectorService } from './vector/vector.service';

@Controller('')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly vectorService: VectorService
  ) {}

  @Post('/scrape-data')
  async getHello(): Promise<ScraperResponseDto> {
    return await this.appService.fetchData();
  }

  @Post('/generate-embedding')
  async generateEmbedding(): Promise<boolean> {
    await this.vectorService.generateEmbeddings();
    return true;
  }

  @Get('/similar-data')
  async getSimilarData(@Body() body: { text: string }): Promise<any> {
    return await this.vectorService.findSimilarParagraph(body.text);
  }
}
