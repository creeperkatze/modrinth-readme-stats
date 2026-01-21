import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Inter font - try multiple paths for different environments
const fontPaths = [
    path.join(__dirname, "..", "assets", "inter.ttf"),
    path.join(process.cwd(), "public", "fonts", "inter.ttf"),
];

let fontBuffer = null;
let loadedFrom = null;

for (const fontPath of fontPaths) {
    try {
        if (existsSync(fontPath)) {
            fontBuffer = readFileSync(fontPath);
            loadedFrom = fontPath;
            logger.info(`Font loaded from: ${fontPath}`);
            break;
        }
    } catch (err) {
        logger.error(`Error trying to load font from ${fontPath}: ${err.message}`);
    }
}

if (!fontBuffer) {
    logger.error(`Font file not found in any of the expected locations`);
    logger.info(`Tried paths: ${fontPaths.join(", ")}`);
    logger.info(`Current working directory: ${process.cwd()}`);
    logger.info(`Module directory: ${__dirname}`);
}


export async function generatePng(svgString)
{
    const options = {
        fitTo: {
            mode: "original"
        }
    };

    // Only add font config if font was loaded successfully
    if (fontBuffer) {
        options.font = {
            loadSystemFonts: false,
            fontFiles: [fontBuffer],
            defaultFontFamily: "Inter"
        };
    } else {
        // Fallback to system fonts if Inter font couldn't be loaded
        logger.warn("Using system fonts as fallback");
        options.font = {
            loadSystemFonts: true
        };
    }

    const resvg = new Resvg(svgString, options);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return pngBuffer;
}