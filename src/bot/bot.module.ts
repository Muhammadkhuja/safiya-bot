import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Bot, BotSchema } from "./schema/bot.schema";
import { BotUpdate } from "./bot.update";

@Module({
  imports: [MongooseModule.forFeature([{ name: Bot.name, schema: BotSchema }])],
  providers: [BotUpdate, BotService],
})
export class BotModule {}
