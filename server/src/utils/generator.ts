export function generateRandomToken(): string {
  return crypto.randomUUID();
}

export function generateRandomString(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomNumber(min: number = 0, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomAvatarURL(username: string): string {
  const random = generateRandomNumber(1000, 9999);
  const baseURL = `https://api.dicebear.com/6.x/initials/svg?seed=${username}${random}`;
  const encodedUsername = encodeURIComponent(username);
  return `${baseURL}?name=${encodedUsername}&background=random&color=fff&size=128`;
}

export function generateRandomUsername(name: string): string {
  const random = generateRandomNumber(1000, 9999);
  const baseUsername = name.replace(/\s+/g, "").toLowerCase();
  return `${baseUsername}${random}`;
}

export function generateRandomFilename(originalName: string): string {
  const timestamp = Date.now();
  const originalBaseName = originalName.split(".").slice(0, -1).join(".");
  const extension = originalName.split(".").pop();
  return `${originalBaseName}_${timestamp}.${extension}`;
}
