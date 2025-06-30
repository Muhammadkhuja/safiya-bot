import { Injectable } from "@nestjs/common";
import { Context, Markup } from "telegraf";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Bot, BotDocument } from "./schema/bot.schema";

@Injectable()
export class BotService {
  private kasallikMap = new Map<number, boolean>();

  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>
  ) {}

  // /start komandasi
  async start(ctx: Context) {
    await ctx.reply("Assalomu alaykum! Telefon raqamingizni yuboring:", {
      reply_markup: {
        keyboard: [
          [{ text: "📞 Telefon raqamni yuborish", request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  // Telefon raqamini qabul qilish
  async onContact(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id || !ctx.message) {
      return ctx.reply("❗️ Foydalanuvchi yoki xabar aniqlanmadi.");
    }

    if ("contact" in ctx.message && ctx.message.contact?.phone_number) {
      const contact = ctx.message.contact;
      let user = await this.botModel.findOne({ user_id });

      if (user) {
        user.phone_number = contact.phone_number;
        await user.save();
      } else {
        await this.botModel.create({
          user_id,
          phone_number: contact.phone_number,
          user_name: ctx.from?.username ?? "",
          first_name: ctx.from?.first_name ?? "",
          last_name: ctx.from?.last_name ?? "",
          lang: ctx.from?.language_code ?? "",
        });
      }

      await ctx.reply("✅ Endi ismingizni yuboring:", {
        reply_markup: { remove_keyboard: true },
      });
    } else {
      await ctx.reply("❗️ Telefon raqami aniqlanmadi.");
    }
  }

  // Ismni qabul qilish
  async onName(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id || !ctx.message) return;

    if ("text" in ctx.message && typeof ctx.message.text === "string") {
      const text = ctx.message.text.trim();

      if (!/^[a-zA-Z\u0400-\u04FF\s'-]{2,}$/.test(text)) {
        return ctx.reply(
          "❗️ Iltimos, faqat harflardan iborat ismingizni yozing."
        );
      }

      const existingUser = await this.botModel.findOne({ user_id });

      if (existingUser) {
        if (!existingUser.name) {
          existingUser.name = text;
          await existingUser.save();
          await ctx.reply(`✅ Ismingiz saqlandi: ${text}`);
        }
      } else {
        await this.botModel.create({
          user_id,
          name: text,
          user_name: ctx.from?.username ?? "",
          first_name: ctx.from?.first_name ?? "",
          last_name: ctx.from?.last_name ?? "",
          lang: ctx.from?.language_code ?? "",
        });

        await ctx.reply(`✅ Ismingiz saqlandi: ${text}`);
      }

      // Lokatsiya so‘rash
      await ctx.reply("📍 Endi joylashuvingizni yuboring:", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Joylashuvni yuborish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } else {
      await ctx.reply("❌ Iltimos, faqat matn yuboring.");
    }
  }

  // Joylashuvni qabul qilish
  async onLocation(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id || !ctx.message) {
      return ctx.reply("❗️ Foydalanuvchi yoki xabar aniqlanmadi.");
    }

    // Faqat location kelgandagina saqlaymiz
    if ("location" in ctx.message && ctx.message.location) {
      const { latitude, longitude } = ctx.message.location;
      const user = await this.botModel.findOne({ user_id });

      if (!user) {
        return ctx.reply("Iltimos, avval /start buyrug'ini bosing.");
      }

      const location = `${latitude},${longitude}`;
      user.location = location;
      await user.save();

      await ctx.reply("✅ Joylashuvingiz saqlandi.");
      return this.kasallikniSozlash(ctx);
    }

    // ⚠️ Aks holda noto‘g‘ri xabar yuborilgan bo‘ladi (matn, sticker, rasm...)
    return ctx.reply("❗️ Iltimos, tugmani bosib joylashuv yuboring!", {
      reply_markup: {
        keyboard: [
          [{ text: "📍 Joylashuvni yuborish", request_location: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    // return ctx.reply("Yo lokatsiya ");
  }

  // Kasallik haqida tugmalar
  async kasallikniSozlash(ctx: Context) {
    await ctx.reply("🩺 Sizda hozirda biron kasallik bormi?", {
      reply_markup: {
        keyboard: [["✅ Ha", "❌ Yo‘q"]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  // Matnli javoblar uchun umumiy handler
  async handleText(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();
    if (!user_id || !text) return;

    const user = await this.botModel.findOne({ user_id });

    // Ism hali yo‘q bo‘lsa, ismni saqlash
    if (user && !user.name) {
      return this.onName(ctx);
    }

    // ❌ Yo‘q -> sog'lom deb saqlash
    if (text === "❌ Yo‘q") {
      if (user) {
        user.illness = "sog'lom";
        await user.save();
      }
      await ctx.reply("✅ Siz sog'lom deb belgilandingiz.", {
        reply_markup: Markup.removeKeyboard().reply_markup,
      });
      return this.nextStep(ctx);
    }

    // ✅ Ha -> kasallik so‘rash
    if (text === "✅ Ha") {
      this.kasallikMap.set(user_id, true); // ➤ Bu foydalanuvchidan kasallik haqida matn kutamiz degani
      return ctx.reply(
        "📝 Qanday kasallik borligini yozing (masalan: gripp, allergiya)",
        { reply_markup: Markup.removeKeyboard().reply_markup } // ➤ Keyboard'ni tozalab yuborish
      );
    }

    // Foydalanuvchi kasallik nomini yozgan bo‘lsa
    if (this.kasallikMap.has(user_id)) {
      if (user) {
        user.illness = text; // qanday yozgan bo‘lsa, shunday saqlaymiz
        await user.save();
        this.kasallikMap.delete(user_id);
        await ctx.reply(`✅ Kasalligingiz saqlandi: ${text}`);
        return this.nextStep(ctx);
      }
    }
    return ctx.reply("❓ Noma'lum buyruq. Iltimos, tugmani bosing !");
  }

  // Keyingi bosqich (kelajakda xizmat turi, manzil, va h.k.)
  async nextStep(ctx: Context) {
    await ctx.reply(
      "🚀 Ro‘yxatdan o‘tish tugadi! Yaqinda xizmatni boshlaysiz."
    );
  }
}
