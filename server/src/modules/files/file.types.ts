type createFileData = {
  targetId?: string;
  module: string;
  isUsed?: boolean;
  size: number;
  url: string;
  path: string;
  createdBy?: string;
  metadata: Record<string, any>;
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
