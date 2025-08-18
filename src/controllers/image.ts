import { Request, Response } from "express";
import sharp from "sharp";
import { School } from "../models/School";
import { Book } from "../models/Book";
import { BookAd } from "../models/BookAd";
import { applyRatio } from "../utils";
import path from "path";
import fs from "fs";

export const getSchoolLogo = async (req: Request<{ schoolID: string }, null, null, { height?: number; width?: number; quality?: number }>, res: Response) => {
    const { schoolID } = req.params;
    const { height, width, quality } = req.query;

    try {
        const school = await School.findById(schoolID);

        if (!school) {
            return res.status(404).json({ error: "School not found" });
        }


        const i = sharp(Buffer.from(school.icon.split(";base64,").pop()!, "base64"));

        const { width: img_w, height: img_h } = await i.metadata();

        let out_w = img_w;
        let out_h = img_h;
        let out_q = Number(quality);

        if (!out_q){
            out_q = 100;
        }

        if(out_q > 100 && out_q < 1){
            return res.status(500).json({ error: "Internal server error" });
        }
        
        if (height && width) {
            out_w = width;
            out_h = height;
        } else if (height) {
            out_w = (img_w * height) / img_h;
            out_h = height;
        } else if (width) {
            out_h = (img_h * width) / img_w;
            out_w = width;
        }


        i.resize(Math.round(out_w), Math.round(out_h));

        const resizedImageBuffer = await i.png({quality:out_q}).toBuffer();
        res.type("image/png"); // Adjust the content type if necessary
        res.send(resizedImageBuffer);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getBookCover = async (req: Request<{ id: string }, null, null, { height?: number; width?: number; quality?: number }>, res: Response) => {
    const { id } = req.params;
    const { height, width, quality } = req.query;

    try {
        const book = await Book.findById(id);

        if (!book) {
            return res.status(404).json({ error: "School not found" });
        }


        const i = sharp(Buffer.from(book.image.split(";base64,").pop()!, "base64"));

        const { width: img_w, height: img_h } = await i.metadata();

        let out_w = img_w;
        let out_h = img_h;
        let out_q = Number(quality);

        if (!out_q){
            out_q = 100;
        }

        if(out_q > 100 && out_q < 1){
            return res.status(500).json({ error: "Internal server error" });
        }
        
        if (height && width) {
            out_w = width;
            out_h = height;
        } else if (height) {
            out_w = (img_w * height) / img_h;
            out_h = height;
        } else if (width) {
            out_h = (img_h * width) / img_w;
            out_w = width;
        }


        i.resize(Math.round(out_w), Math.round(out_h));

        const resizedImageBuffer = await i.png({quality:out_q}).toBuffer();
        res.type("image/png"); // Adjust the content type if necessary
        res.send(resizedImageBuffer);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};