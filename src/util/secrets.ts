import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
  logger.debug("Using .env file to supply config environment variables");
  dotenv.config({ path: ".env" });
} else {
  logger.debug(
    "Using .env.example file to supply config environment variables",
  );
  dotenv.config({ path: ".env.example" }); // you can delete this after you create your own .env file!
}

export const version = {
  "version": "2.0.0",
  "build": "production", 
  "timestamp": "2025-08-18T10:25:00Z",
  "environment": "docker"
};
// JSON.parse(
//   fs.readFileSync("./dist/meta.json", { encoding: "utf-8" }),
// );
console.log(version);
export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_USER = process.env.MAIL_USER;
export const MAIL_SHOWMAIL = process.env.MAIL_SHOWMAIL;
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'
export const IS_PROD = prod;

export const SESSION_SECRET = process.env["SESSION_SECRET"];
export const MONGODB_URI = prod
  ? process.env["MONGODB_URI"]
  : (process.env["MONGODB_URI_DEV"] || process.env["MONGODB_URI_LOCAL"] || "mongodb://mongo:27017/signumlbri");

if (!SESSION_SECRET) {
  logger.error("No client secret. Set SESSION_SECRET environment variable.");
  process.exit(1);
}

if (!MONGODB_URI) {
  if (prod) {
    logger.error(
      "No mongo connection string. Set MONGODB_URI environment variable.",
    );
  } else {
    logger.error(
      "No mongo connection string. Set MONGODB_URI_LOCAL environment variable.",
    );
  }
  process.exit(1);
}
