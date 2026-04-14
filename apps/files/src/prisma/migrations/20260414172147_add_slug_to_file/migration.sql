/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_slug_key" ON "File"("slug");
