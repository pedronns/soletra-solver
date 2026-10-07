CREATE TYPE "WordStatus" AS ENUM ('ACCEPTED', 'REJECTED');

CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "status" "WordStatus",
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Word_word_key" ON "Word"("word");
