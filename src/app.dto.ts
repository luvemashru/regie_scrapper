import { IsInt } from 'class-validator';

export class ScraperResponseDto {
    @IsInt()
    categoryCount: number;

    @IsInt()
    articleCount: number;
}