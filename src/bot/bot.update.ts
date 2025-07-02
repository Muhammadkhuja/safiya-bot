import { Action, Ctx, On, Start, Update } from "nestjs-telegraf";
import { BotService } from "./bot.service";
import { Context } from "telegraf";

@Update()
export class BotUpdate {
  constructor(private readonly BotService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    return this.BotService.start(ctx);
  }

   @Action('✅ Ha')
  async onNo(ctx: Context) {
    return this.BotService.onNo(ctx)
  }

  @On("contact")
  async OnContact(@Ctx() ctx: Context) {
    return this.BotService.onContact(ctx);
  }

  @On("location")
  async Onlocation(@Ctx() ctx: Context) {
    return this.BotService.onLocation(ctx);
  }
  @On("text")
  async onText(@Ctx() ctx: Context) {
    return this.BotService.handleText(ctx);
  }

  //   @On("message")
  //   async OnMessage(@Ctx() ctx: Context) {
  //     console.log(ctx.botInfo);
  //     console.log(ctx.chat);
  //     console.log(ctx.chat!.id);
  //     console.log(ctx.from);
  //     console.log(ctx.from!.id);
  //   }
}
