import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CreateWordDto } from './dto/create-word.dto'
import { ListWordsDto } from './dto/list-words.dto'
import { UpdateWordStatusDto } from './dto/update-word-status.dto'
import { WordsService } from './words.service'

@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  create(@Body() body: CreateWordDto) {
    return this.wordsService.create(
      body.word,
      body.letters,
      body.requiredLetter,
    )
  }

  @Get('added')
  findAdded() {
    return this.wordsService.findAdded()
  }

  @Get()
  findMany(@Query() query: ListWordsDto) {
    return this.wordsService.findMany(query.words)
  }

  @Get(':word')
  findOne(@Param('word') word: string) {
    return this.wordsService.findOne(word)
  }

  @Patch(':word')
  updateStatus(
    @Param('word') word: string,
    @Body() body: UpdateWordStatusDto,
  ) {
    return this.wordsService.updateStatus(word, body.status)
  }
}
