import { Injectable } from "@nestjs/common";
import { Context, Markup } from "telegraf";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Bot, BotDocument } from "./schema/bot.schema";

@Injectable()
export class BotService {
  private kasallikMap = new Map<number, boolean>();
  private userStateMap = new Map<number, string>(); // User state tracking

  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>
  ) {}

  async start(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) return;

      const user = await this.botModel.findOne({ user_id });
      
      if (!user) {
        // Yangi foydalanuvchi yaratish
        await this.botModel.create({
          user_id: user_id,
          user_name: ctx.from?.username || "",
          first_name: ctx.from?.first_name || "",
          last_name: ctx.from?.last_name || "",
          lang: ctx.from?.language_code || "",
        });

        this.userStateMap.set(user_id, 'phone');
        await ctx.replyWithHTML(
          `Safiya Baby Spa botiga hush kelibsiz! 👋\n\nIltimos, <b>📞 Telefon raqamni yuborish</b> tugmasini bosing`,
          {
            ...Markup.keyboard([
              [Markup.button.contactRequest("📞 Telefon raqamni yuborish")],
            ])
              .oneTime()
              .resize(),
          }
        );
      } else {
        // Mavjud foydalanuvchi uchun tekshirish
        await this.checkUserProgress(ctx, user);
      }
    } catch (error) {
      console.error("Start error:", error);
      await ctx.reply(
        "⚠️ Botni ishga tushirishda xatolik. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }

  // Foydalanuvchi ma'lumotlarini tekshirish va keyingi bosqichga o'tkazish
  async checkUserProgress(ctx: Context, user: any) {
    const user_id = ctx.from?.id;
    if (!user_id) return;

    if (!user.phone_number) {
      this.userStateMap.set(user_id, 'phone');
      await ctx.replyWithHTML(
        `Iltimos, <b>📞 Telefon raqamni yuborish</b> tugmasini bosing`,
        {
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞 Telefon raqamni yuborish")],
          ])
            .oneTime()
            .resize(),
        }
      );
    } else if (!user.name) {
      this.userStateMap.set(user_id, 'name');
      await ctx.reply("✅ Endi ismingizni yuboring", {
        reply_markup: { remove_keyboard: true },
      });
    } else if (!user.location) {
      this.userStateMap.set(user_id, 'location');
      await ctx.reply("📍 Endi joylashuvingizni yuboring:", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Joylashuvni yuborish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } else if (!user.illness) {
      this.userStateMap.set(user_id, 'illness_question');
      await this.askIllnessQuestion(ctx);
    } else {
      // Barcha ma'lumotlar to'liq
      this.userStateMap.delete(user_id);
      this.kasallikMap.delete(user_id);
      await ctx.reply(
        "🎉 Siz allaqachon ro'yxatdan o'tgansiz!\n\n📋 Sizning ma'lumotlaringiz:\n" +
        `👤 Ism: ${user.name}\n` +
        `📞 Telefon: ${user.phone_number}\n` +
        `🏥 Kasallik: ${user.illness}`,
        { ...Markup.removeKeyboard() }
      );
    }
  }

  async onContact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id || !ctx.message) return;

      if ("contact" in ctx.message && ctx.message.contact?.phone_number) {
        const contact = ctx.message.contact;
        let user = await this.botModel.findOne({ user_id });

        if (user) {
          user.phone_number = contact.phone_number;
          await user.save();
        } else {
          user = await this.botModel.create({
            user_id,
            phone_number: contact.phone_number,
            user_name: ctx.from?.username || "",
            first_name: ctx.from?.first_name || "",
            last_name: ctx.from?.last_name || "",
            lang: ctx.from?.language_code || "",
          });
        }

        // Keyingi bosqichga o'tish
        this.userStateMap.set(user_id, 'name');
        await ctx.reply("✅ Telefon raqam saqlandi. Endi ismingizni yuboring:", {
          reply_markup: { remove_keyboard: true },
        });
      } else {
        await ctx.reply("❗️ Telefon raqami aniqlanmadi. Iltimos, tugmani bosing.");
      }
    } catch (error) {
      console.error("Contact error:", error);
      await ctx.reply(
        "⚠️ Telefon raqamni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }

  async onName(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id || !ctx.message || !("text" in ctx.message)) return;
      
      const text = ctx.message.text.trim();

      // Ism validatsiyasi
      if (!/^[a-zA-ZА-Яа-я\u0400-\u04FF\s'-]{2,50}$/.test(text)) {
        return await ctx.reply(
          "❗️ Iltimos, faqat harflardan iborat ismingizni yozing (2-50 belgi orasida)."
        );
      }

      const user = await this.botModel.findOne({ user_id });
      if (!user) return await this.start(ctx);

      user.name = text;
      await user.save();

      // Keyingi bosqichga o'tish
      this.userStateMap.set(user_id, 'location');
      await ctx.reply(`✅ ${text} ismingiz saqlandi.`);
      await ctx.reply("📍 Endi joylashuvingizni yuboring:", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Joylashuvni yuborish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (error) {
      console.error("Name error:", error);
      await ctx.reply(
        "⚠️ Ismni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }

  async onLocation(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id || !ctx.message) return;

      const user = await this.botModel.findOne({ user_id });
      if (!user) return await this.start(ctx);

      if ("location" in ctx.message && ctx.message.location) {
        const { latitude, longitude } = ctx.message.location;
        user.location = `${latitude},${longitude}`;
        await user.save();

        // Keyingi bosqichga o'tish
        this.userStateMap.set(user_id, 'illness_question');
        await ctx.reply("✅ Joylashuvingiz saqlandi.", {
          reply_markup: { remove_keyboard: true },
        });
        return await this.askIllnessQuestion(ctx);
      }

      await ctx.reply("❗️ Iltimos, tugmani bosib joylashuv yuboring!", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Joylashuvni yuborish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (error) {
      console.error("Location error:", error);
      await ctx.reply(
        "⚠️ Joylashuvni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }

  async askIllnessQuestion(ctx: Context) {
    try {
      await ctx.reply("🩺 Farzandingizda hozirda biron kasallik bormi?", {
        reply_markup: {
          keyboard: [["✅ Ha", "❌ Yo'q"]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (error) {
      console.error("Ask illness error:", error);
    }
  }

  async handleText(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!ctx.message || !("text" in ctx.message) || !user_id) return;

      const text = ctx.message.text.trim();
      console.log("Received text:", text, "from user:", user_id);

      if (!text) return;

      const user = await this.botModel.findOne({ user_id });
      if (!user) return await this.start(ctx);

      const currentState = this.userStateMap.get(user_id);
      console.log("Current user state:", currentState);

      // Har xil state bo'yicha ishlov berish
      switch (currentState) {
        case 'phone':
          await ctx.reply("❗️ Iltimos, telefon raqamingizni tugma orqali yuboring!");
          break;

        case 'name':
          await this.onName(ctx);
          break;

        case 'location':
          await ctx.reply("❗️ Iltimos, joylashuvingizni tugma orqali yuboring!");
          break;

        case 'illness_question':
          if (text === "✅ Ha" || text === "❌ Yo'q" || text === "❌ Yoʻq") {
            if (text === "✅ Ha") {
              this.kasallikMap.set(user_id, true);
              this.userStateMap.set(user_id, 'illness_description');
              return await ctx.reply(
                "📝 Farzandingizda qanday kasallik borligini yozing:",
                { reply_markup: { remove_keyboard: true } }
              );
            } else {
              user.illness = "sog'lom";
              await user.save();
              this.kasallikMap.delete(user_id);
              this.userStateMap.delete(user_id);
              
              await ctx.reply("✅ Ma'lumotlaringiz to'liq saqlandi!", {
                reply_markup: { remove_keyboard: true }
              });
              return await ctx.reply(
                "🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!\n\n" +
                "📋 Sizning ma'lumotlaringiz:\n" +
                `👤 Ism: ${user.name}\n` +
                `📞 Telefon: ${user.phone_number}\n` +
                `🏥 Holat: Sog'lom`
              );
            }
          } else {
            await ctx.reply("❗️ Iltimos, 'Ha' yoki 'Yo'q' tugmasini bosing!");
          }
          break;

        case 'illness_description':
          if (text.length < 2) {
            return await ctx.reply(
              "❗️ Iltimos, kamida 2 ta belgidan iborat kasallik nomini yozing"
            );
          }

          user.illness = text;
          await user.save();
          this.kasallikMap.delete(user_id);
          this.userStateMap.delete(user_id);

          await ctx.reply(`✅ Ma'lumotlaringiz to'liq saqlandi!`, {
            reply_markup: { remove_keyboard: true }
          });
          return await ctx.reply(
            "🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!\n\n" +
            "📋 Sizning ma'lumotlaringiz:\n" +
            `👤 Ism: ${user.name}\n` +
            `📞 Telefon: ${user.phone_number}\n` +
            `🏥 Kasallik: ${text}`
          );

        default:
          // Agar barcha ma'lumotlar to'liq bo'lsa
          if (user.phone_number && user.name && user.location && user.illness) {
            return await ctx.reply(
              "🎉 Siz allaqachon ro'yxatdan o'tgansiz!\n\n" +
              "📋 Sizning ma'lumotlaringiz:\n" +
              `👤 Ism: ${user.name}\n` +
              `📞 Telefon: ${user.phone_number}\n` +
              `🏥 Kasallik: ${user.illness}`
            );
          } else {
            // To'lmagan ma'lumotlarni tekshirish
            await this.checkUserProgress(ctx, user);
          }
          break;
      }
    } catch (error) {
      console.error("Error in handleText:", error);
      await ctx.reply(
        "⚠️ Ichki xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }

  // Ma'lumotlarni tozalash (agar kerak bo'lsa)
  async resetUser(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) return;

      this.userStateMap.delete(user_id);
      this.kasallikMap.delete(user_id);
      
      await this.botModel.deleteOne({ user_id });
      await ctx.reply("🔄 Ma'lumotlaringiz tozalandi. /start buyrug'ini yuboring.");
    } catch (error) {
      console.error("Reset error:", error);
    }
  }
}