import { Resvg } from "@resvg/resvg-js";

export async function generatePng(svgString)
{
    const resvg = new Resvg(svgString, {
        fitTo: {
            mode: "original"
        }
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return pngBuffer;
}
