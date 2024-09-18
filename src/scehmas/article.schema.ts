import { Schema, Document } from 'mongoose';

interface ContentBlock {
  type: string; // 'paragraph', 'video', etc.
  content: any; // Use 'any' to handle various content types
}

// Define the Article interface representing a document in MongoDB
export interface Article extends Document {
  title: string;
  subtitle: string;
  content: ContentBlock[];
  articleSlug: string;
  categorySlug: string; // Assume each article is linked to a category
  updatedAt: Date;
  embedding: number[];
}

const ContentSchema = new Schema<ContentBlock>({
  type: { type: String, required: true },
  content: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

// Define the Article schema using Mongoose
export const ArticleSchema = new Schema<Article>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: false },
    content: [ContentSchema],
    articleSlug: { type: String, required: true },
    categorySlug: { type: String, required: true },
    updatedAt: { type: Date },
    embedding: [Number],
  },
  {
    timestamps: true,
  },
);
