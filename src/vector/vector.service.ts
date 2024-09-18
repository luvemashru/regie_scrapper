import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { Category } from '../scehmas/category.schema';
import { Article } from '../scehmas/article.schema';
const cosineSimilarity = require('compute-cosine-similarity');

@Injectable()
export class VectorService {
  private openai: OpenAI;
  private readonly ApiKey: string =
    '';
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Article') private readonly articleModel: Model<Article>,
  ) {
    this.openai = new OpenAI({ apiKey: this.ApiKey });
  }

  //Generate vector embeddings
  async uploadEmbeddings(bulkOps: [any]): Promise<void> {
    try {
      const result = await this.articleModel.bulkWrite(bulkOps);
      console.log('Bulk write operation result:', result);
    } catch (error) {
      console.error('Error during bulk write:', error);
    }
  }

  cleanText(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getContent(contents: any[]) {
    return contents
      .map((content) => {
        if (content.type === 'paragraph') {
          return this.cleanText(content.content.text);
        }
      })
      .join(' ');
  }

  async findSimilarParagraph(message: string): Promise<any> {
    const inputVector = (
      await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: message,
      })
    ).data[0].embedding;

    const articles = await this.articleModel
      .find({ embedding: { $exists: true } })
      .exec();
    const similarArticles = [];

    for (const article of articles) {
      try {
        const similarity = cosineSimilarity(inputVector, [
          ...article.embedding,
        ]);
        if (similarity > 0.75) {
          similarArticles.push(this.getContent(article.content));
        }
      } catch (e) {
        console.log(e);
      }
    }
    return await this.determineSufficiencyAndGenerateAnswer(
      similarArticles,
      message,
    );
  }

  async generateEmbeddings(): Promise<void> {
    try {
      let articleEmbedding = [];
      const articles = await this.articleModel.find({
        embedding: { $exists: false },
      });
      console.log('Total Articles: ', articles.length);
      for (let i = 0; i < articles.length; i++) {
        const contents = articles[i].content;
        const a = [];
        contents.map((content) => {
          if (content.type === 'paragraph') {
            a.push(this.cleanText(content.content.text));
          }
        });

        console.log(a.join(' '));
        const vectorResponse = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: a.join(' '),
        });

        const embeddings = vectorResponse.data[0].embedding;
        console.log(embeddings);
        articleEmbedding.push({
          updateOne: {
            filter: { _id: articles[i]._id },
            update: { $set: { embedding: embeddings } },
          },
        });

        if (i % 10 === 0) {
          console.log(`Completed ${i} counts`);
          const result = await this.articleModel.bulkWrite(articleEmbedding);
          articleEmbedding = [];
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  async determineSufficiencyAndGenerateAnswer(
    retrievedData: string[],
    inputMessage: string,
  ): Promise<{ sufficient: boolean; answer?: string }> {
    const context = retrievedData.join('\n'); // Combine all retrieved data into a single string

    const prompt = `
      The following data has been retrieved from a knowledge base:

      ${context}

      The user has asked the following question: "${inputMessage}"

      Based on the retrieved data, is the information sufficient to answer the user's question?
      If yes, provide the answer to the question and set the flag 'sufficient' to true.
      If no, set the flag 'sufficient' to false.
			return response in the following format:
			{
				message: "replace with answer if the info is sufficient" || "Information is not sufficient, creating jira ticket",
				sufficient: true/false
			}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4', // Specify the model
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that determines whether retrieved data is sufficient to answer user questions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const answer = response.choices[0].message.content;

      return JSON.parse(answer);
      // // Determine whether the data is sufficient based on the LLM response
      // if (answer.toLowerCase().includes('sufficient: false')) {
      //   return { sufficient: false };
      // } else if (answer.toLowerCase().includes('sufficient: true')) {
      //   // Extract the answer to the question
      //   const parsedAnswer = answer.split('Answer:')[1]?.trim() || '';
      //   return {
      //     sufficient: true,
      //     answer: parsedAnswer,
      //   };
      // }

      // return { sufficient: false }; // Default if no clear flag is provided
    } catch (error) {
      console.error('Error in generating completion from OpenAI:', error);
      throw new Error('Failed to determine sufficiency and generate answer');
    }
  }
}
