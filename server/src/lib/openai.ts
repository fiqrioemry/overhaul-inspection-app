import OpenAI from "openai";
import { openaiConfig } from "@/config/env";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!openaiConfig.API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    _client = new OpenAI({ apiKey: openaiConfig.API_KEY });
  }
  return _client;
}
