export const AI_PROVIDERS = {
  groq: "groq",
  openai: "openai",
};

export type ProviderType = keyof typeof AI_PROVIDERS;
