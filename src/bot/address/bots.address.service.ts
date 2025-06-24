// import { Injectable } from "@nestjs/common";
// import { InjectModel } from "@nestjs/sequelize";
// import { Bot } from "../model/bot.model";
// import { Ctx, Hears, InjectBot } from "nestjs-telegraf";
// import { BOT_NAME } from "../../app.constants";
// import { Context, Markup, Telegraf } from "telegraf";
// import { Address } from 

// @Injectable()
// export class AddressService {
//   constructor(
//     @InjectModel(Bot) private readonly botModel: typeof Bot,
//     @InjectModel(Address) private readonly addressModel: typeof Address,
//     @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
//   ) {}

//   async OnAddress(ctx: Context) {
//     try {
//       await ctx.replyWithHTML(
//         "Manzil bo'yicha kerakli tugmani bosing on addres",
//         {
//           ...Markup.keyboard([
//             ["Mening manzillarim", "Yangi manzil qo'shish"],
//           ])
//             .oneTime()
//             .resize(),
//         }
//       );
//     } catch (error) {
//       console.log(`Error on Contact`, error);
//     }
//   }

//   async OnNewAddress(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       const user = await this.botModel.findByPk(user_id);
//       if (!user) {
//         await ctx.replyWithHTML(`Iltimos, <b>start</b> tugmasini bosing`, {
//           ...Markup.keyboard([["/start"]])
//             .oneTime()
//             .resize(),
//         });
//         console.log("hatpoo");
//       }
//       await this.addressModel.create({
//         user_id: user_id!,
//         last_state: "name",
//       });
//       await ctx.replyWithHTML("Yangi manzilni kiriting ");
//     } catch (error) {
//       console.log(`Error on Contact`, error);
//     }
//   }

//   async onMyAddresses(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       const user = await this.botModel.findByPk(user_id);
//       if (!user
//         ) {
//         await ctx.replyWithHTML(`<b>start</b>`, {
//           ...Markup.keyboard([["/start"]])
//             .oneTime()
//             .resize(),
//         });
//       } else {
//         const address = await this.addressModel.findAll({
//           where: { user_id, last_state: "finish" },
//         });
//         if (address.length == 0) {
//           await ctx.replyWithHTML("Birorta ham manzil topilmadi", {
//             ...Markup.keyboard([
//               ["Mening manzillarim", "Yangi manzil qo'shish"],
//             ]),
//           });
//         } else {
//           address.forEach(async (address) => {
//             await ctx.replyWithHTML(
//               `<b>Manzil nomi</b>${address.name}\n<b>Manzil:</b> ${address.address}`,
//               {
//                 reply_markup: {
//                   inline_keyboard: [
//                     [
//                       {
//                         text: "Lokatsiyani ko'rish",
//                         callback_data: `loc_${address.id}`,
//                       },
//                       {
//                         text: "Manzilni o'chirish",
//                         callback_data: `del_${address.id}`,
//                       },
//                     ],
//                   ],
//                 },
//               }
//             );
//           });
//         }
//       }
//     } catch (error) {
//       console.log("OnMyAddresses error", error);
//     }
//   }

//   async OnClicLocation(ctx: Context) {
//     try {
//       const contextAction = ctx.callbackQuery!["data"]
//       const contextMessage = ctx.callbackQuery!["message"]
//       const address_id = contextAction.split("_")[1];
//       const addres = await this.addressModel.findByPk(address_id)
//       await ctx.deleteMessage(contextMessage?.message_id)
//       await ctx.replyWithLocation(
//         Number(addres?.location?.split(",")[0]),
//         Number(addres?.location?.split(",")[1])
//       ) 
//     } catch (error) {
//       console.log("OnClicLocation error", error);
      
//     }
//   }
//   async OnClicDelete(ctx: Context) {
//     try {
//       const contextAction = ctx.callbackQuery!["data"]

//       const address_id = contextAction.split("_")[1];
//       await this.addressModel.destroy({
//         where: {id:  address_id }
//       })

//       await ctx.editMessageText("Manzil o'chirildi")
//     } catch (error) {
//       console.log("OnClicDeleten error", error);
      
//     }
//   }
// }
