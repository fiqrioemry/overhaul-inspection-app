type createFileData = {
  module: string;
  size: number;
  url: string;
  path: string;
  metadata: Record<string, any>;
};
type fileResponse = {
  id: string;
  url: string;
  path: string;
  createdAt: Date;
};

export { createFileData, fileResponse };
