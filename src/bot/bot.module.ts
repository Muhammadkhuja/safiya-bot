import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Bot, BotSchema } from "./schema/bot.schema";
import { BotUpdate } from "./bot.update";
import { AddressService } from "./address/bots.address.service";
import { AddressUpadte } from "./address/bot.address.update";
import { Address } from "./schema/bot.location";
import { AddressSchema } from "./schema/bot.location";

@Module({
  imports: [MongooseModule.forFeature([{ name: Bot.name, schema: BotSchema },
      { name: Address.name, schema: AddressSchema },])],
  providers: [BotUpdate, AddressService, AddressUpadte, BotService],
  exports: [BotService],
})
export class BotModule {}
