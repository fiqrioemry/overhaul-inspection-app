import { maxSize } from "zod";

const fileLimiter = {
  singleFile: {
    limit: 5, // limit each IP to 5 login requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  multipleFile: {
    limit: 100, // limit each user to 100 active sessions
    windowSec: 60, // Per 60 secs hit 100 times
  },

  fileOptions: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
  },
};

export default fileLimiter;
