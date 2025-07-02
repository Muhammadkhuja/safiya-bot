// import { Injectable } from "@nestjs/common";
// import { Context } from "telegraf";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { Bot, BotDocument } from "./schema/bot.schema";

// @Injectable()
// export class BotService {
//   private kasallikMap = new Map<number, boolean>();

//   constructor(
//     @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>
//   ) {}

//   async start(ctx: Context) {
//     try {
//       await ctx.reply("Assalomu alaykum! Iltimos telefon raqamingizni yub augmenter", {
//         reply_markup: {
//           keyboard: [
//             [{ text: "📞 Telefon raqamni yuborish", request_contact: true }],
//           ],
//           resize_keyboard: true,
//           one_time_keyboard: true,
//         },
//       });
//     } catch (error) {
//       console.error("Start error:", error);
//       await ctx.reply("⚠️ Botni ishga tushirishda xatolik. Iltimos, qaytadan urinib ko'ring.");
//     }
//   }

//   async onContact(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       if (!user_id || !ctx.message) return;

//       if ("contact" in ctx.message && ctx.message.contact?.phone_number) {
//         const contact = ctx.message.contact;
//         let user = await this.botModel.findOne({ user_id });

//         if (user) {
//           user.phone_number = contact.phone_number;
//           await user.save();
//         } else {
//           user = await this.botModel.create({
//             user_id,
//             phone_number: contact.phone_number,
//             user_name: ctx.from?.username ?? "",
//             first_name: ctx.from?.first_name ?? "",
//             last_name: ctx.from?.last_name ?? "",
//             lang: ctx.from?.language_code ?? "",
//           });
//         }

//         await ctx.reply("✅ Endi ismingizni yuboring", {
//           reply_markup: { remove_keyboard: true },
//         });
//       } else {
//         await ctx.reply("❗️ Telefon raqami aniqlanmadi.");
//       }
//     } catch (error) {
//       console.error("Contact error:", error);
//       await ctx.reply("⚠️ Telefon raqamni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring.");
//     }
//   }

//   async onName(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       if (!user_id || !ctx.message || !("text" in ctx.message)) return;
//       const text = ctx.message.text.trim();

//       if (!/^[a-zA-Z\u0400-\u04FF\s'-]{2,}$/.test(text)) {
//         return await ctx.reply("❗️ Iltimos, faqat harflardan iborat ismingizni yozing (kamida 2 belgi).");
//       }

//       const user = await this.botModel.findOne({ user_id });
//       if (!user) return await this.start(ctx);

//       user.name = text;
//       await user.save();

//       await ctx.reply(`✅ ${text} ismingiz saqlandi.`);
//       await ctx.reply("📍 Endi joylashuvingizni yuboring:", {
//         reply_markup: {
//           keyboard: [
//             [{ text: "📍 Joylashuvni yuborish", request_location: true }],
//           ],
//           resize_keyboard: true,
//           one_time_keyboard: true,
//         },
//       });
//     } catch (error) {
//       console.error("Name error:", error);
//       await ctx.reply("⚠️ Ismni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring.");
//     }
//   }

//   async onLocation(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       if (!user_id || !ctx.message) return;

//       const user = await this.botModel.findOne({ user_id });
//       if (!user) return await this.start(ctx);

//       if ("location" in ctx.message && ctx.message.location) {
//         const { latitude, longitude } = ctx.message.location;
//         user.location = `${latitude},${longitude}`;
//         await user.save();

//         await ctx.reply("✅ Joylashuvingiz saqlandi.", {
//           reply_markup: { remove_keyboard: true },
//         });
//         return await this.askIllnessQuestion(ctx);
//       }

//       await ctx.reply("❗️ Iltimos, tugmani bosib joylashuv yuboring!", {
//         reply_markup: {
//           keyboard: [
//             [{ text: "📍 Joylashuvni yuborish", request_location: true }],
//           ],
//           resize_keyboard: true,
//           one_time_keyboard: true,
//         },
//       });
//     } catch (error) {
//       console.error("Location error:", error);
//       await ctx.reply("⚠️ Joylashuvni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring.");
//     }
//   }

//   async askIllnessQuestion(ctx: Context) {
//     try {
//       await ctx.reply("🩺 Farzandingizda hozirda biron kasallik bormi?", {
//         reply_markup: {
//           keyboard: [["✅ Ha", "❌ Yo'q"]],
//           resize_keyboard: true,
//           one_time_keyboard: true,
//         },
//       });
//     } catch (error) {
//       console.error("Ask illness error:", error);
//       await ctx.reply("⚠️ Kasallik so'rovida xatolik. Iltimos, qaytadan urinib ko'ring.");
//     }
//   }

//   async handleText(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       if (!ctx.message || !("text" in ctx.message)) return;

//       const text = ctx.message.text.trim();
//       console.log("Received text:", text, "from user:", user_id);

//       if (!user_id || !text) return;

//       const user = await this.botModel.findOne({ user_id });
//       if (!user) return await this.start(ctx);

//       // Check if all required fields are already set
//       if (user.phone_number && user.name && user.location && user.illness) {
//         return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
//       }

//       // Handle illness question response
//       if (!user.illness && (text === "✅ Ha" || text === "❌ Yo'q" || text === "❌ Yoʻq")) {
//         if (text === "✅ Ha") {
//           this.kasallikMap.set(user_id, true);
//           return await ctx.reply(
//             "📝 Farzandingizda qanday kasallik borligini yozing:",
//             { reply_markup: { remove_keyboard: true } }
//           );
//         } else {
//           user.illness = "sog'lom";
//           await user.save();
//           this.kasallikMap.delete(user_id);
//           await ctx.reply("✅ Farzandingiz sog'lom deb belgilandi.");
//           // Check if all fields are complete after saving illness
//           if (user.phone_number && user.name && user.location && user.illness) {
//             return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
//           }
//           return;
//         }
//       }

//       // Handle illness description
//       if (this.kasallikMap.has(user_id)) {
//         if (text.length < 2) {
//           return await ctx.reply("❗️ Iltimos, kamida 2 ta belgidan iborat kasallik nomini yozing");
//         }

//         user.illness = text;
//         await user.save();
//         this.kasallikMap.delete(user_id);
//         await ctx.reply(`✅ Kasallik saqlandi: ${text}`);
//         // Check if all fields are complete after saving illness
//         if (user.phone_number && user.name && user.location && user.illness) {
//           return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
//         }
//         return;
//       }

//       // Check for missing information and guide user to the next step
//       if (!user.phone_number) return await this.start(ctx);
//       if (!user.name) return await this.onName(ctx);
//       if (!user.location) return await this.onLocation(ctx);
//       if (!user.illness) return await this.askIllnessQuestion(ctx);

//     } catch (error) {
//       console.error("Error in handleText:", error);
//       await ctx.reply("⚠️ Ichki xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
//     }
//   }
// }






import { Injectable } from "@nestjs/common";
import { Context } from "telegraf";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Bot, BotDocument } from "./schema/bot.schema";

@Injectable()
export class BotService {
  private kasallikMap = new Map<number, boolean>();

  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>
  ) {}

  async start(ctx: Context) {
    try {
      await ctx.reply("Assalomu alaykum! Iltimos telefon raqamingizni yuboring", {
        reply_markup: {
          keyboard: [
            [{ text: "📞 Telefon raqamni yuborish", request_contact: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (error) {
      console.error("Start error:", error);
      await ctx.reply("⚠️ Botni ishga tushirishda xatolik. Iltimos, qaytadan urinib ko'ring.");
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
            user_name: ctx.from?.username ?? "",
            first_name: ctx.from?.first_name ?? "",
            last_name: ctx.from?.last_name ?? "",
            lang: ctx.from?.language_code ?? "",
          });
        }

        await ctx.reply("✅ Endi ismingizni yuboring", {
          reply_markup: { remove_keyboard: true },
        });
      } else {
        await ctx.reply("❗️ Telefon raqami aniqlanmadi.");
      }
    } catch (error) {
      console.error("Contact error:", error);
      await ctx.reply("⚠️ Telefon raqamni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring.");
    }
  }

  async onName(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id || !ctx.message || !("text" in ctx.message)) return;
      const text = ctx.message.text.trim();

      if (!/^[a-zA-Z\u0400-\u04FF\s'-]{2,}$/.test(text)) {
        return await ctx.reply("❗️ Iltimos, faqat harflardan iborat ismingizni yozing (kamida 2 belgi).");
      }

      const user = await this.botModel.findOne({ user_id });
      if (!user) return await this.start(ctx);

      user.name = text;
      await user.save();

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
      await ctx.reply("⚠️ Ismni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring.");
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
      await ctx.reply("⚠️ Joylashuvni qabul qilishda xatolik. Iltimos, qaytadan urinib ko'ring.");
    }
  }

  async askIllnessQuestion(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) return;

      const user = await this.botModel.findOne({ user_id });
      if (!user) return await this.start(ctx);

      // Skip if registration is already complete
      if (user.phone_number && user.name && user.location && user.illness) {
        return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
      }

      await ctx.reply("🩺 Farzandingizda hozirda biron kasallik bormi?", {
        reply_markup: {
          keyboard: [["✅ Ha", "❌ Yo'q"]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (error) {
      console.error("Ask illness error:", error);
      await ctx.reply("⚠️ Kasallik so'rovida xatolik. Iltimos, qaytadan urinib ko'ring.");
    }
  }

  // async handleText(ctx: Context) {
  //   try {
  //     const user_id = ctx.from?.id;
  //     if (!ctx.message || !("text" in ctx.message) || !user_id) return;

  //     const text = ctx.message.text.trim();
  //     console.log("Received text:", text, "from user:", user_id);

  //     const user = await this.botModel.findOne({ user_id });
  //     if (!user) return await this.start(ctx);

  //     // Check if registration is already complete
  //     if (user.phone_number && user.name && user.location && user.illness) {
  //       return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
  //     }

  //     // Handle illness question response
  //     if (!user.illness && (text === "✅ Ha" || text === "❌ Yo'q")) {
  //       if (text === "✅ Ha") {
  //         this.kasallikMap.set(user_id, true);
  //         return await ctx.reply(
  //           "📝 Farzandingizda qanday kasallik borligini yozing:",
  //           { reply_markup: { remove_keyboard: true } }
  //         );
  //       } else {
  //         user.illness = "sog'lom";
  //         await user.save();
  //         // this.kasallikMap.delete(user_id);
  //         // await ctx.reply("✅ Farzandingiz sog'lom deb belgilandi.");
  //         // // Check if registration is complete
  //         // if (user.phone_number && user.name && user.location && user.illness) {
  //         //   return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
  //         // }
  //         return;
  //       }
  //     }

  //     // Handle illness description
  //     // if (this.kasallikMap.has(user_id)) {
  //     //   if (text.length < 2) {
  //     //     return await ctx.reply("❗️ Iltimos, kamida 2 ta belgidan iborat kasallik nomini yozing");
  //     //   }

  //     //   user.illness = text;
  //     //   await user.save();
  //     //   this.kasallikMap.delete(user_id);
  //     //   await ctx.reply(`✅ Kasallik saqlandi: ${text}`);
  //     //   // Check if registration is complete
  //     //   if (user.phone_number && user.name && user.location && user.illness) {
  //     //     return await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
  //     //   }
  //     //   return;
  //     // }

  //     // Guide user to the next missing step
  //     if (!user.phone_number) return await this.start(ctx);
  //     if (!user.name) return await this.onName(ctx);
  //     if (!user.location) return await this.onLocation(ctx);
  //     if (!user.illness) return await this.askIllnessQuestion(ctx);

  //   } catch (error) {
  //     console.error("Error in handleText:", error);
  //     await ctx.reply("⚠️ Ichki xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
  //   }
  // }


  async onNo (ctx: Context){
    console.log(ctx.message)
  }

async handleText(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!ctx.message || !("text" in ctx.message) || !user_id) return;

      const text = ctx.message.text.trim();
      console.log("Received text:", text, "from user:", user_id);

      const user = await this.botModel.findOne({ user_id });
      if (!user) return await this.start(ctx);

      // Handle illness question response
      // if (user.name == 'illness') {
      //   if (text === "✅ Ha" || text === "❌ Yo'q") {
      //     if (text === "✅ Ha") {
      //       this.kasallikMap.set(user_id, true);
      //       user.name = 'illness'
      //       await user.save()
      //       await ctx.reply(
      //         "📝 Farzandingizda qanday kasallik borligini yozing:",
      //         { reply_markup: { remove_keyboard: true } }
      //       );
      //     } else {
      //       user.illness = "sog'lom"; // Bu yerda ilgari "illness" deb yozilgan edi
      //       await user.save();
      //       await ctx.reply("✅ Farzandingiz sog'lom deb belgilandi.");
      //     }
      //     return;
      //   } else {
      //     // Agar foydalanuvchi "Ha" yoki "Yo'q" emas yozsa
      //     await this.askIllnessQuestion(ctx);
      //     return;
      //   }
      // }


      // if(user.name == "illness"){
      //   user.illness = ctx.message.text
      //   await user.save()
      //   await ctx.reply(`✅ Kasallik saqlandi: ${text}`)
      // }

      // Kasallik nomini qabul qilish
      if (this.kasallikMap.get(user_id) && text.length >= 2) {
        user.illness = text;
        await user.save();
        this.kasallikMap.delete(user_id);
        await ctx.reply(`✅ Kasallik saqlandi: ${text}`);
        return;
      }

      // Keyingi qadamlarga yo'naltirish
      if (!user.phone_number) {
        await this.start(ctx);
      } else if (!user.name) {
        await this.onName(ctx);
      } else if (!user.location) {
        await this.onLocation(ctx);
      } else if (!user.illness) {
        await this.askIllnessQuestion(ctx);
      } else {
        await ctx.reply("🎉 Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
      }

    } catch (error) {
      console.error("Error in handleText:", error);
      if (error instanceof Error) {
        await ctx.reply(`⚠️ Xatolik: ${error.message}`);
      } else {
        await ctx.reply("⚠️ Noma'lum xatolik yuz berdi");
      }
    }
  }


}