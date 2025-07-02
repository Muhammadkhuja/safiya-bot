import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// Mongoose hujjat turi
export type AddressDocument = Address & Document;

@Schema({ collection: "address", timestamps: true })
export class Address {
  @Prop({ required: false })
  user_id?: number;

  @Prop({ required: true, maxlength: 50 })
  name: string;

  @Prop({ required: true, maxlength: 50 })
  address: string;

  @Prop({ required: true, maxlength: 50 })
  location: string;

  @Prop({ required: true, maxlength: 50 })
  last_state: string;
}

// NestJS uchun schema factory
export const AddressSchema = SchemaFactory.createForClass(Address);
