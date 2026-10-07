import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'
import { normalizeWord } from '../word-normalization'

export class CreateWordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeWord(value) : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^\p{L}+$/u)
  word!: string

  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((letter) =>
          typeof letter === 'string'
            ? letter.normalize('NFC').toUpperCase()
            : letter,
        )
      : value,
  )
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[A-ZÀ-ÖØ-ÞÇ]$/u, { each: true })
  letters!: string[]

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.normalize('NFC').toUpperCase()
      : value,
  )
  @IsString()
  @Matches(/^[A-ZÀ-ÖØ-ÞÇ]$/u)
  requiredLetter!: string
}
