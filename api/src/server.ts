import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// =============================================================================
// Config
// =============================================================================
const API_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 3001;

// =============================================================================
// AI Provider Configuration
// =============================================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Initialize clients
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;
const google = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

// Model mappings
const defaultBaseURL = OPENAI_BASE_URL || "https://api.openai.com/v1";

const MODELS: Record<
  string,
  { provider: string; client: unknown; baseURL?: string }
> = {
  // OpenAI / MiniMax / Custom
  "gpt-4o": { provider: "openai", client: openai, baseURL: defaultBaseURL },
  "gpt-4o-mini": {
    provider: "openai",
    client: openai,
    baseURL: defaultBaseURL,
  },
  "gpt-4-turbo": {
    provider: "openai",
    client: openai,
    baseURL: defaultBaseURL,
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    client: openai,
    baseURL: defaultBaseURL,
  },
  "MiniMax-M2.1": {
    provider: "openai",
    client: openai,
    baseURL: "https://api.minimax.chat/v1",
  },
  "MiniMax-M2.1-lightning": {
    provider: "openai",
    client: openai,
    baseURL: "https://api.minimax.chat/v1",
  },
  "MiniMax-M2.5": {
    provider: "openai",
    client: openai,
    baseURL: "https://api.minimax.chat/v1",
  },

  // Anthropic (Claude)
  "claude-3-5-sonnet-20241022": { provider: "anthropic", client: anthropic },
  "claude-3-5-sonnet": { provider: "anthropic", client: anthropic },
  "claude-3-opus-20240229": { provider: "anthropic", client: anthropic },
  "claude-3-opus": { provider: "anthropic", client: anthropic },
  "claude-3-sonnet-20240229": { provider: "anthropic", client: anthropic },
  "claude-3-haiku-20240307": { provider: "anthropic", client: anthropic },

  // Google (Gemini)
  "gemini-2.0-flash": { provider: "google", client: google },
  "gemini-2.0-flash-exp": { provider: "google", client: google },
  "gemini-1.5-pro": { provider: "google", client: google },
  "gemini-1.5-flash": { provider: "google", client: google },
  "gemini-1.5-flash-8b": { provider: "google", client: google },
};

function getModelConfig(model: string) {
  // Check exact match first
  if (MODELS[model]) return MODELS[model];

  // Check prefix match for dynamic models
  if (model.startsWith("gpt-"))
    return { ...MODELS["gpt-4o"], baseURL: defaultBaseURL };
  if (model.startsWith("claude-")) return MODELS["claude-3-5-sonnet"];
  if (model.startsWith("gemini-")) return MODELS["gemini-1.5-flash"];

  // Unknown model - use custom base URL if set, otherwise default
  if (OPENAI_BASE_URL) {
    return { provider: "openai", client: openai, baseURL: OPENAI_BASE_URL };
  }

  // Default to MiniMax
  return MODELS["MiniMax-M2.1"];
}

// =============================================================================
// Express App
// =============================================================================
const app = express();

// =============================================================================
// Rate Limiting
// =============================================================================
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "AI rate limit exceeded, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/enhance", aiLimiter);
app.use("/custom", aiLimiter);
app.use(generalLimiter);

// =============================================================================
// Authentication
// =============================================================================
const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (!API_TOKEN) return next();

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: "Invalid or missing API token" });
  }
  next();
};

// =============================================================================
// Middleware
// =============================================================================
app.use(cors());
app.use(express.json());

// =============================================================================
// Default Prompts
// =============================================================================
const DEFAULT_PROMPTS: Record<string, string> = {
  rewrite:
    "Rewrite this text to be clearer, more engaging, and human-sounding. Avoid AI patterns: no inflated significance, promotional language, or vague attributions. Vary sentence rhythm. Have opinions.",

  summarize:
    "Summarize this text concisely. Keep only key facts. No filler phrases like 'in conclusion' or 'it is important to note'. Be direct.",

  humanize:
    "Humanize this text - remove all signs of AI writing: no inflated symbolism, promotional language, em dash overuse, rule of three, AI vocabulary (additionally, crucial, pivotal, vibrant, testament), vague attributions, or hedging. Add personality and voice. Sound like a real person.",

  grammar:
    "Fix any grammar, spelling, and punctuation errors. Keep the writing natural - don't overcorrect. Preserve the author's voice.",

  formal:
    "Convert to formal, professional tone. Use precise language. No contractions. Avoid promotional language or buzzwords. Be direct and authoritative.",

  casual:
    "Convert to casual, friendly tone. Sound like a real person talking. Use contractions. Add personality. Don't be stiff.",

  academic:
    "Rewrite in formal academic style. Cite specific sources. Use precise terminology. Avoid first person. Structure with clear arguments. No buzzwords.",

  seo: "Optimize for search engines: include relevant keywords naturally, use headers, structure for featured snippets. Keep readable. No keyword stuffing.",

  persuasive:
    "Rewrite as a compelling persuasive argument. Use rhetorical techniques, strong calls to action, address counterarguments. Make it convincing.",

  creative:
    "Add creative flair: vivid metaphors, engaging descriptions, narrative elements. Make it memorable and distinctive.",

  twitter:
    "Shorten to under 280 characters. Keep the core message. Add relevant hashtags if appropriate. Make it punchy.",

  linkedin:
    "Format as a professional LinkedIn post: engaging hook, short paragraphs, relevant hashtags. Professional but personable.",

  story:
    "Convert into a short narrative: include characters, setting, conflict, resolution. Make it engaging and memorable.",
};

// =============================================================================
// AI Chat Function
// =============================================================================
async function chatWithAI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
) {
  const config = getModelConfig(model);

  if (!config.client) {
    throw new Error(`Provider not configured for model ${model}`);
  }

  if (config.provider === "openai") {
    const client = config.baseURL
      ? new OpenAI({ apiKey: OPENAI_API_KEY!, baseURL: config.baseURL })
      : openai!;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return {
      result: response.choices[0]?.message?.content || "",
      model: model,
      usage: response.usage,
    };
  }

  if (config.provider === "anthropic") {
    const response = await anthropic!.messages.create({
      model: model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    return {
      result:
        response.content[0].type === "text" ? response.content[0].text : "",
      model: model,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens:
          response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  if (config.provider === "google") {
    const genModel = google!.getGenerativeModel({ model: model });

    const result = await genModel.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const response = result.response;

    return {
      result: response.text(),
      model: model,
      usage: null,
    };
  }

  throw new Error(`Unknown provider for model ${model}`);
}

// =============================================================================
// Routes
// =============================================================================

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/models", (req, res) => {
  const availableModels = Object.entries(MODELS).map(([name, config]) => ({
    name,
    provider: config.provider,
    configured: !!config.client,
  }));
  res.json({ models: availableModels });
});

app.post("/enhance", authenticate, async (req, res) => {
  try {
    const { prompt, text, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!prompt && !DEFAULT_PROMPTS[req.body.mode]) {
      return res.status(400).json({ error: "Prompt or mode is required" });
    }

    let fullPrompt = prompt;
    if (!prompt && req.body.mode && DEFAULT_PROMPTS[req.body.mode]) {
      fullPrompt = DEFAULT_PROMPTS[req.body.mode];
    }

    const chatModel = model || process.env.DEFAULT_MODEL || "MiniMax-M2.1";
    const systemPrompt =
      "You are a helpful writing assistant. Provide only the improved text without explanations.";

    const result = await chatWithAI(
      chatModel,
      systemPrompt,
      `${fullPrompt}\n\n${text}`,
    );
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to enhance text";
    console.error("Error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/custom", authenticate, async (req, res) => {
  try {
    const { prompt, text, model } = req.body;

    if (!text || !prompt) {
      return res.status(400).json({ error: "Text and prompt are required" });
    }

    const fullPrompt = prompt.replace(/{text}/g, text);
    const chatModel = model || process.env.DEFAULT_MODEL || "MiniMax-M2.1";
    const systemPrompt =
      "You are a helpful writing assistant. Provide only the result.";

    const result = await chatWithAI(chatModel, systemPrompt, fullPrompt);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process text";
    console.error("Error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

app.get("/prompts", authenticate, (req, res) => {
  res.json(DEFAULT_PROMPTS);
});

// =============================================================================
// Start Server
// =============================================================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Lubb Writer API                            ║
║   Running on port ${PORT}                          ║
║   Providers: OpenAI/MiniMax, Anthropic, Google   ║
╚═══════════════════════════════════════════════════╝
  `);
});
