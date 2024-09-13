import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleSchema } from './scehmas/article.schema';
import { CategorySchema } from './scehmas/category.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/scraper'),
    MongooseModule.forFeature([
      { name: 'Category', schema: CategorySchema },
      { name: 'Article', schema: ArticleSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
