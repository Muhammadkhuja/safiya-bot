import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Context, Markup, Telegraf } from "telegraf";
import { InjectBot } from "nestjs-telegraf";
import { Bot, BotDocument } from "./schema/bot.schema";
import { BOT_NAME } from "name-bot";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
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
        await ctx.replyWithHTML(`Endi Joylashuvingizni tashlasangiz`, {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log(`Error on Contact`, error);
    }
  }

  async onName(ctx: Context) {
    const user = ctx.from;

    if (!ctx.message || !("text" in ctx.message) || !user) {
      return ctx.reply("Nomaʼlum yoki noto‘g‘ri xabar formati.");
    }

    const message = ctx.message.text;
    const user_id = user.id;

    const existingUser = await this.botModel.findOne({ user_id });

    if (existingUser) {
      // 🔍 Agar name mavjud bo‘lsa, ruxsat bermaymiz
      if (existingUser.name) {
        return ctx.reply(
          `Siz allaqachon ro'yxatdan o'tgansiz. Ismingiz: ${existingUser.name}`
        );
      }

      // name bo‘sh bo‘lsa, yangilaymiz
      existingUser.set({ name: message });
      await existingUser.save();
    } else {
      // Umuman mavjud bo‘lmasa — yangi user yaratamiz
      await this.botModel.create({
        user_id: user.id,
        user_name: user.username,
        name: message,
        first_name: user.first_name,
        last_name: user.last_name,
        lang: user.language_code,
      });
    }

    await ctx.reply(`✅ Ismingiz qabul qilindi: ${message}`);
    return;
  }

  //   async onLocation(ctx: Context){
  //     try {
  //       if("location" in ctx.message!){
  //         const user_id = ctx.from?.id;
  //         const user = await this.botModel.findOne(user_id);
  //         if(!user){
  //           await ctx.reply("Siz avval ro'yxatdan o'ting",{
  //             parse_mode: "HTML",
  //             ...Markup.keyboard([["/start"]]).resize(),
  //           });
  //         }else{
  //           const address = await this.addressModel.findOne({
  //             where:{
  //               user_id,
  //               last_state: { [Op.ne]: "finish"},
  //             },
  //             order: [["id", "DESC"]],
  //           });
  //           if(address && address.last_state == "location"){
  //             address.location = `${ctx.message.location.latitude}, ${ctx.message.location.longitude}`;
  //             address.last_state = "finish";
  //             await address.save()
  //             await ctx.reply("Manzil saqlandi", {
  //               parse_mode: "HTML",
  //               ...Markup.keyboard([
  //                 ["Mening manzillarim", "Yangi manzillar qo'shish"],
  //               ]).resize()
  //             })
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.log("OnLocation error:", error);

  //     }
  //   }
}
