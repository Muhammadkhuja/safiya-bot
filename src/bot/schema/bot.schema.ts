import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type BotDocument = Bot & Document;

@Schema({ collection: 'bot' })
export class Bot{
  @Prop({ type: Number, required: true, unique: true })
  user_id: number;

  @Prop({ type: String, maxlength: 100 })
  user_name: string;

  @Prop({ type: String, maxlength: 100 })
  name: string;

  @Prop({ type: String, maxlength: 50 })
  first_name: string;

  @Prop({ type: String, maxlength: 50 })
  last_name: string;

  @Prop({ type: String, maxlength: 15 })
  phone_number: string;

  @Prop({ type: String, maxlength: 3 })
  lang: string;

  @Prop({ type: Boolean, default: false })
  status: boolean;

  @Prop({ type: String, maxlength: 50 })
  location: string;
  
  // @Prop({ required: true, maxlength: 50 })
  // last_state: string;
}

export const BotSchema = SchemaFactory.createForClass(Bot);
