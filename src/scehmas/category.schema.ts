import { Schema, Document } from 'mongoose';

// Define the Category interface representing a document in MongoDB
export interface Category extends Document {
    name: string;
    description?: string;
    updatedAt: Date;
    slug: string;
    articlesCount: number;
}

// Define the Category schema using Mongoose
export const CategorySchema = new Schema<Category>({
    name: { type: String, required: true },
    description: { type: String, required: false }, 
    updatedAt: { type: Date, required: false},
    slug: {type: String, required: true, unique: true},
    articlesCount: {type: Number, required: false}
},
{
    timestamps: true, // Automatically manage createdAt and updatedAt fields
},
);