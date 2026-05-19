import sharp from "sharp";

export async function processImage(file: File, width: number, height: number, format: keyof sharp.FormatEnum): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const processedImage = await sharp(buffer)
    .resize(width, height, {
      fit: "cover",
    })
    .toFormat(format)
    .toBuffer();

  return processedImage;
}

export async function processFile(file: File, format: string): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
