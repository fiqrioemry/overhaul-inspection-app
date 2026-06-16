export type ImageProcessMode = "avatar" | "inspection_attachment";

type fileMetadata = {
  originalName: string;
  mimeType: string;
  originalMimeType?: string;
  processedMimeType?: string;
  processMode?: ImageProcessMode;
  resizeMode?: "cover" | "inside";
  maxWidth?: number;
  maxHeight?: number;
  cropped?: boolean;
};

type createFileData = {
  module?: string;
  isUsed?: boolean;
  size?: number;
  url?: string;
  path?: string;
  mimeType?: string;
  createdBy?: string;
  metadata?: fileMetadata;
  imageBuffer?: Buffer;
};

type fileResponse = {
  id: string;
  url: string;
  isUsed: boolean;
  path: string;
  createdAt: Date;
  module: string;
};

export { createFileData, fileResponse };
