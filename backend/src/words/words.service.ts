import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WordStatus } from './dto/update-word-status.dto'
import { normalizeWord } from './word-normalization'

function normalizeForChallenge(value: string): string {
  return value
    .toLowerCase()
    .replace(/ç/g, '\u0000')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0000/g, 'ç')
    .normalize('NFC')
}

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: string, letters: string[], requiredLetter: string) {
    const word = this.normalizeInput(input)
    if (Array.from(word).length < 4) {
      throw new BadRequestException(
        'A palavra precisa ter pelo menos 4 letras.',
      )
    }
    if (!/^\p{L}+$/u.test(word)) {
      throw new BadRequestException(
        'Use apenas letras, sem espaços ou caracteres especiais.',
      )
    }

    const normalizedLetters = letters.map(normalizeForChallenge)
    const normalizedRequiredLetter = normalizeForChallenge(requiredLetter)
    if (
      normalizedLetters.length !== 7 ||
      new Set(normalizedLetters).size !== 7 ||
      !normalizedLetters.includes(normalizedRequiredLetter)
    ) {
      throw new BadRequestException(
        'Selecione as 7 letras distintas e a letra central antes de adicionar.',
      )
    }

    const availableLetters = new Set(normalizedLetters)
    const normalizedWord = normalizeForChallenge(word)
    if (!Array.from(normalizedWord).every((letter) => availableLetters.has(letter))) {
      throw new BadRequestException(
        'Essa palavra não pode ser formada com as letras selecionadas.',
      )
    }
    if (!normalizedWord.includes(normalizedRequiredLetter)) {
      throw new BadRequestException(
        'Essa palavra precisa conter a letra central.',
      )
    }

    const existing = await this.prisma.word.findUnique({
      where: { word },
      select: { word: true },
    })

    if (existing) {
      throw new ConflictException('A palavra já existe no dicionário.')
    }

    try {
      return await this.prisma.word.create({
        data: { word, userAdded: true },
        select: { word: true, status: true },
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A palavra já existe no dicionário.')
      }

      throw error
    }
  }

  findAdded() {
    return this.prisma.word.findMany({
      where: { userAdded: true },
      orderBy: { word: 'asc' },
      select: { word: true, status: true },
    })
  }

  async findOne(input: string) {
    const word = this.normalizeInput(input)
    const result = await this.prisma.word.findUnique({
      where: { word },
      select: { word: true, status: true },
    })

    if (!result) {
      throw new NotFoundException('Palavra não encontrada no dicionário.')
    }

    return result
  }

  async findMany(inputs: string[]) {
    const words = inputs.map((input) => this.normalizeInput(input))
    return this.prisma.word.findMany({
      where: { word: { in: Array.from(new Set(words)) } },
      select: { word: true, status: true },
    })
  }

  async updateStatus(input: string, status: WordStatus | null) {
    const word = this.normalizeInput(input)

    try {
      return await this.prisma.word.update({
        where: { word },
        data: { status },
        select: { word: true, status: true },
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Palavra não encontrada no dicionário.')
      }

      throw error
    }
  }

  private normalizeInput(input: string): string {
    const word = normalizeWord(input)
    if (!word) {
      throw new BadRequestException('A palavra não pode estar vazia.')
    }
    return word
  }
}
