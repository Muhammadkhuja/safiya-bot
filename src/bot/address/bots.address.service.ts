import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Bot, BotDocument } from "../schema/bot.schema";
import { Address } from "../schema/bot.location";
import { Model } from "mongoose";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "../../../name-bot";
import { Context, Markup, Telegraf } from "telegraf";

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>,
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async OnAddress(ctx: Context) {
    try {
      await ctx.replyWithHTML("Manzil bo'yicha kerakli tugmani bosing", {
        ...Markup.keyboard([["Mening manzillarim", "Yangi manzil qo'shish"]])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log(`Error on OnAddress`, error);
    }
  }

  async OnNewAddress(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({ user_id });

      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>start</b> tugmasini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
        return;
      }

      await this.addressModel.create({
        user_id,
        last_state: "name",
      });

      await ctx.replyWithHTML("📝 Yangi manzilni kiriting:");
    } catch (error) {
      console.log(`Error on OnNewAddress`, error);
    }
  }

  async onMyAddresses(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({ user_id });

      if (!user) {
        await ctx.replyWithHTML(`<b>/start</b> buyrug'ini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
        return;
      }

      const addresses = await this.addressModel.find({
        user_id,
        last_state: "finish",
      });

      if (addresses.length === 0) {
        await ctx.replyWithHTML("📭 Manzillar topilmadi", {
          ...Markup.keyboard([
            ["Mening manzillarim", "Yangi manzil qo'shish"],
          ]).resize(),
        });
        return;
      }

      for (const address of addresses) {
        await ctx.replyWithHTML(
          `<b>Manzil nomi:</b> ${address.name}\n<b>Manzil:</b> ${address.address}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📍 Lokatsiyani ko'rish",
                    callback_data: `loc_${address._id}`,
                  },
                  {
                    text: "❌ Manzilni o'chirish",
                    callback_data: `del_${address._id}`,
                  },
                ],
              ],
            },
          }
        );
      }
    } catch (error) {
      console.log("onMyAddresses error", error);
    }
  }

  async OnClicLocation(ctx: Context) {
    try {
      if ("data" in ctx.callbackQuery!) {
        const callbackData = ctx.callbackQuery.data;
        // ...

        const message = ctx.callbackQuery?.message;

        const address_id = callbackData?.split("_")[1];
        const address = await this.addressModel.findById(address_id);

        if (!address || !address.location) {
          return await ctx.reply("Manzil topilmadi yoki lokatsiya yo‘q.");
        }

        const [lat, lon] = address.location.split(",");

        await ctx.deleteMessage((message as any)?.message_id);

        await ctx.replyWithLocation(Number(lat), Number(lon));
      }
    } catch (error) {
      console.log("OnClicLocation error", error);
    }
  }

  async OnClicDelete(ctx: Context) {
    try {
      if ("data" in ctx.callbackQuery!) {
        const callbackData = ctx.callbackQuery.data;
        const address_id = callbackData?.split("_")[1];
        await this.addressModel.deleteOne({ _id: address_id });
      }

      await ctx.editMessageText("🗑️ Manzil o'chirildi");
    } catch (error) {
      console.log("OnClicDelete error", error);
    }
  }
}
