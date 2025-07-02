import { Action, Command, Ctx, Hears, Update } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { BotService } from "../bot.service";
import { AddressService } from "./bots.address.service";

@Update()
export class AddressUpadte {
  constructor(
    private readonly botService: BotService,
    private readonly addressService: AddressService
  ) {}

  @Command("address")
  async OnAddress(@Ctx() ctx: Context) {
    return this.addressService.OnAddress(ctx);
  }

  @Hears("Yangi manzil qo'shish")
  async OnNewAddress(@Ctx() ctx: Context) {
    return this.addressService.OnNewAddress(ctx);
  }

  @Hears("Mening manzillarim")
  async OnMyAddress(@Ctx() ctx: Context) {
    return this.addressService.onMyAddresses(ctx);
  }

  @Action(/^loc_+\d+/)
  async OnClicLocation(@Ctx() ctx: Context) {
    return this.addressService.OnClicLocation(ctx);
  }

  @Action(/^del_+\d+/)
  async OnClicDelete(@Ctx() ctx: Context) {
    return this.addressService.OnClicDelete(ctx);
  }
}
  