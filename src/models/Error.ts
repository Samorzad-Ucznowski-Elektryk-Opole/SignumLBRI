import mongoose from "mongoose";
import { UserDocument } from "./User";
import { ObjectId } from "bson";
export type ErrorDocument = mongoose.Document & {
	name?: string;
	message?: string;
	stack?: string;
	cause?: unknown;
	code?: string;
	user: UserDocument;
	agent: string;
};

const errorSchema = new mongoose.Schema<ErrorDocument>(
  {
	name: String,
	message: String,
	stack: String,
	cause: mongoose.Schema.Types.Mixed,
	code: String,
	user: ObjectId,
	agent: String,
  },
  { timestamps: true },
);
export const Error = mongoose.model<ErrorDocument>("Error", errorSchema);
