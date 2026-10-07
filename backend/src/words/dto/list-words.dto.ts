import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
} from 'class-validator'

export const MAX_WORDS_PER_REQUEST = 500

export class ListWordsDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_WORDS_PER_REQUEST)
  @IsString({ each: true })
  words!: string[]
}
