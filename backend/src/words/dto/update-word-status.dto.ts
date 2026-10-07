import { IsIn } from 'class-validator'

export const WORD_STATUSES = ['ACCEPTED', 'REJECTED'] as const
export type WordStatus = (typeof WORD_STATUSES)[number]

export class UpdateWordStatusDto {
  @IsIn([...WORD_STATUSES, null])
  status!: WordStatus | null
}
