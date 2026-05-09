type createFileData = {
  module: string;
  size: number;
  url: string;
  path: string;
  createdBy?: string;
  expiredAt: Date;
  metadata: Record<string, any>;
};
type fileResponse = {
  id: string;
  url: string;
  path: string;
  createdAt: Date;
};

export { createFileData, fileResponse };
