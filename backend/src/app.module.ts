import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { WordsModule } from './words/words.module'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, WordsModule],
})
export class AppModule {}
