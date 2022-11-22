-- CreateTable
CREATE TABLE "Filtered" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" JSONB NOT NULL,

    CONSTRAINT "Filtered_pkey" PRIMARY KEY ("id")
);
