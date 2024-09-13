import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Category } from './scehmas/category.schema';
import { Article } from './scehmas/article.schema';
import { ScraperResponseDto } from './app.dto';

@Injectable()
export class AppService {
  private readonly baseUrl = 'https://tawk.help/api';
  private readonly propertyId = '6467a768ad80445890edf29e';
  private readonly siteId = 'primary';

  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Article') private readonly articleModel: Model<Article>,
  ) {}

  // Base parameters for requests
  private readonly params = {
    propertyId: this.propertyId,
    siteId: this.siteId,
    withAuthors: 'true',
  };

  // Function to fetch all categories
  async fetchCategories(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/categories`, {
        params: this.params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Function to fetch all articles inside a category
  async fetchArticles(categorySlug: string): Promise<any> {
    try {
      const articleParams = { ...this.params, categorySlug };
      const response = await axios.get(`${this.baseUrl}/articles`, {
        params: articleParams,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching articles for category ${categorySlug}:`,
        error,
      );
      throw error;
    }
  }

  // Function to fetch a single article
  async fetchArticleDetails(articleSlug: string): Promise<any> {
    try {
      const singleArticleParams = { ...this.params, slug: articleSlug };
      const response = await axios.get(`${this.baseUrl}/article`, {
        params: singleArticleParams,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching article details for slug ${articleSlug}:`,
        error,
      );
      throw error;
    }
  }

  async modifyAndUploadCategory(categories): Promise<void> {
    const categoriesData = []
    for(const category of categories) {
      categoriesData.push(
        {
          name: category.name,
          description: category.description,
          updatedAt: category.updatedAt,
          slug:category.slug,
          articlesCount: category.articlesCount
        }
      ) 
    }
    this.categoryModel.insertMany(categoriesData);
  }

  async uploadArticles(articles) {
    await this.articleModel.insertMany(articles)
  }
  
  // Main function to start scraping data
  async fetchData(): Promise<ScraperResponseDto> {
    try {
      // Fetch and upload categories
      const categoriesData = await this.fetchCategories();
      // await this.modifyAndUploadCategory(categoriesData?.data?.categories);
      
      // Fetching Articles under categories
      let totalArticles = 0;
      let count = 0
      for (const category of categoriesData?.data?.categories ?? []) {
        // Fetch articles based on slug
        const slug = category.slug;
        const articlesData = await this.fetchArticles(slug);
        count += 1
        const articleDetails = [];
        //Fetch Article Content 
        for (const article of articlesData?.data?.articles ?? []) {
          const articleSlug = article.slug;
          const articleData = await this.fetchArticleDetails(articleSlug);
          articleDetails.push({
            title:articleData.data.article.title,
            subtitle:articleData.data.article.subtitle,
            content:articleData.data.article.contents,
            articleSlug:articleData.data.article.slug,
            categorySlug:slug,
            updatedAt:articleData.data.article.updatedAt
          })
          totalArticles += 1;
        }
        await this.uploadArticles(articleDetails)
        console.log(`Processed ${count} categories`)
      }
      console.log(`Total Articles: ${totalArticles}`);
      console.log(JSON.stringify(categoriesData, null, 2));
      return {
        articleCount: totalArticles,
        categoryCount: categoriesData?.data?.categories.length
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
}
