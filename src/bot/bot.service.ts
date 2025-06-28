import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Context, Markup, Telegraf } from "telegraf";
import { InjectBot } from "nestjs-telegraf";
import { Bot, BotDocument } from "./schema/bot.schema";
import { BOT_NAME } from "name-bot";
import { Address } from "./schema/bot.location";
import { Message } from "telegraf/typings/core/types/typegram"; // kerak bo'ladi

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>
  ) {}

  async start(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) return;

      const user = await this.botModel.findOne({ user_id });

      if (!user) {
        await this.botModel.create({
          user_id: user_id,
          user_name: ctx.from?.username ?? "",
          first_name: ctx.from?.first_name ?? "",
          last_name: ctx.from?.last_name ?? "",
          lang: ctx.from?.language_code ?? "",
          status: false,
          phone_number: "",
          location: "",
          // last_state: "phone"
        });

        await ctx.replyWithHTML(
          `Iltimos, <b> 📞 Telefon raqamni yuborish</b> tugmasini bosing`,
          Markup.keyboard([
            [Markup.button.contactRequest("Telefon raqamni yuborish")],
          ])
            .oneTime()
            .resize()
        );
      } else if (!user.status || !user.phone_number) {
        await ctx.replyWithHTML(
          `Iltimos, <b>Telefon raqamni yuborish</b> tugmasini bosing`,
          Markup.keyboard([
            [Markup.button.contactRequest("Telefon raqamni yuborish")],
          ])
            .oneTime()
            .resize()
        );
      } else {
        await ctx.replyWithHTML(
          "Bu botga xush kelibsiz!",
          Markup.removeKeyboard()
        );
      }
    } catch (error) {
      console.error(`Error on Start`, error);
    }
  }

  async onContact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({ user_id });
      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>start</b> tugmasini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
      } else if (user.phone_number) {
        await this.bot.telegram.sendChatAction(user_id!, "typing");
        await ctx.replyWithHTML(
          "savol nechimarta kontakt jo'natmoqchisiz a 🤨",
          { ...Markup.removeKeyboard() }
        );
      } else if (
        "contact" in ctx.message! &&
        ctx.message!.contact.user_id != user_id
      ) {
        await ctx.replyWithHTML(`Iltimos o'zingizni telefon raqamni yuboring`, {
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞 Telefon raqamni yuborish")],
          ])
            .oneTime()
            .resize(),
        });
      } else if ("contact" in ctx.message!) {
        let phone = ctx.message.contact.phone_number;
        if (phone[0] != "+") {
          phone = "+" + phone;
        }
        user.phone_number = phone;
        user.status = true;
        await user.save();
        await ctx.replyWithHTML(`Iltimos, ismingizni kiriting:`, {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log(`Error on Contact`, error);
    }
  }

  async onName(ctx: Context) {
    const user = ctx.from;

    if (!ctx.message || !user) {
      return ctx.reply(
        "Noto‘g‘ri xabar formati yoki foydalanuvchi aniqlanmadi."
      );
    }

    if (!("text" in ctx.message)) {
      return ctx.reply(
        "❌ Iltimos, faqat matn yuboring. Sticker, rasm yoki gif emas."
      );
    }

    const message = ctx.message.text.trim();
    const user_id = user.id;

    if (!/^[a-zA-Z\u0400-\u04FF\s'-]{2,}$/.test(message)) {
      return ctx.reply(
        "❌ Iltimos, haqiqiy ismingizni yuboring. Emoji, raqam yoki belgilar emas."
      );
    }

    const existingUser = await this.botModel.findOne({ user_id });

    if (existingUser) {
      if (!existingUser.name) {
        existingUser.set({ name: message });
        await existingUser.save();
        await ctx.reply(`✅ ${message} ismingiz saqlandi.`);

        // Lokatsiya tugmasini yuborish
        return ctx.reply("📍 Endi joylashuvingizni yuboring:", {
          reply_markup: {
            keyboard: [
              [{ text: "📍 Joylashuvni yuborish", request_location: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      } else {
        return ctx.reply(
          `Siz allaqachon ro'yxatdan o'tgansiz. Ismingiz: ${existingUser.name}`
        );
      }
    } else {
      await this.botModel.create({
        user_id: user.id,
        user_name: user.username ?? "",
        name: message,
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        lang: user.language_code ?? "",
      });

      await ctx.reply(`✅ Ismingiz qabul qilindi: ${message}`);

      // Lokatsiya tugmasini yuborish
      return ctx.reply("📍 Endi joylashuvingizni yuboring:", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Joylashuvni yuborish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
  }

  async onLocation(ctx: Context) {
    try {
      console.log("📍 Location handler started");

      if (!ctx.message || !("location" in ctx.message)) {
        console.log("🚫 No location in message:", ctx.message);
        return ctx.reply(
          "❗️ Iltimos, pastdagi tugma orqali lokatsiyangizni yuboring."
        );
      }

      const user_id = ctx.from?.id;
      if (!user_id) {
        console.log("🚫 User ID not found in ctx");
        return ctx.reply("Foydalanuvchi aniqlanmadi.");
      }

      const user = await this.botModel.findOne({ user_id });
      if (!user) {
        console.log("🚫 User not found in DB:", user_id);
        return ctx.reply("Iltimos, avval /start buyrug'ini bosing.");
      }

      const latitude = ctx.message.location.latitude;
      const longitude = ctx.message.location.longitude;
      const location = `${latitude},${longitude}`;
      console.log("✅ Received location:", location);

      user.location = location;
      await user.save();

      console.log("✅ Location saved to user model:", user);

      await ctx.reply("✅ Joylashuvingiz muvaffaqiyatli saqlandi!");
    } catch (error) {
      console.error("❌ onLocation error:", error);
      await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  }

  // reply_markup: {
  //   keyboard: [[{ text: "📄 Mening manzillarim" }]];
  //   resize_keyboard: true;
  //   one_time_keyboard: true;
  // };
}
