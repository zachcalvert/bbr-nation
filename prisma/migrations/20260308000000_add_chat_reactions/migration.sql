-- CreateTable
CREATE TABLE "chat_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_reactions_message_id_user_id_emoji_key" ON "chat_reactions"("message_id", "user_id", "emoji");

-- AddForeignKey
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
