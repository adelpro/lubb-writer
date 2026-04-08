import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import "dotenv/config";

// =============================================================================
// Config
// =============================================================================
const API_TOKEN = process.env.API_TOKEN?.trim();
const PORT = process.env.PORT || 3001;
const API_VERSION = "1.1.0";

// =============================================================================
// Type Definitions
// =============================================================================
type ProviderFormat = "openai" | "anthropic" | "google";

interface ModelConfig {
  name: string;
  provider: ProviderFormat;
  providerName: string;
  apiKey: string;
  baseURL?: string;
  client: unknown;
}

// =============================================================================
// Helper Functions
// =============================================================================
function parseModelsList(
  envValue: string | undefined,
  defaults: string[],
): string[] {
  if (!envValue) return defaults;
  return envValue
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function extractProviderName(baseURL: string): string {
  try {
    const url = new URL(baseURL);
    const host = url.hostname;
    if (host.includes("minimax")) return "MiniMax";
    if (host.includes("ollama")) return "Ollama";
    if (host.includes("lmstudio")) return "LM Studio";
    if (host.includes("groq")) return "Groq";
    if (host.includes("together")) return "Together AI";
    if (host.includes("anyscale")) return "Anyscale";
    if (host.includes("openrouter")) return "OpenRouter";
    if (host.includes("localhost")) return "Local";
    return host.split(".")[0];
  } catch {
    return "Custom";
  }
}

function getDefaultBaseURL(format: ProviderFormat): string {
  switch (format) {
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com";
    case "google":
      return "https://generativelanguage.googleapis.com";
  }
}

// =============================================================================
// Provider Registry Builder
// =============================================================================
function buildProviderRegistry(): Record<string, ModelConfig> {
  const MODELS: Record<string, ModelConfig> = {};

  // OpenAI Provider
  if (process.env.OPENAI_API_KEY) {
    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const models = parseModelsList(process.env.OPENAI_MODELS, [
      "gpt-4o",
      "gpt-4o-mini",
    ]);
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL,
    });

    for (const modelName of models) {
      MODELS[modelName] = {
        name: modelName,
        provider: "openai",
        providerName: "OpenAI",
        apiKey: process.env.OPENAI_API_KEY,
        baseURL,
        client: openaiClient,
      };
    }
  }

  // Anthropic Provider
  if (process.env.ANTHROPIC_API_KEY) {
    const models = parseModelsList(process.env.ANTHROPIC_MODELS, [
      "claude-3-5-sonnet",
    ]);
    const anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    for (const modelName of models) {
      MODELS[modelName] = {
        name: modelName,
        provider: "anthropic",
        providerName: "Anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: getDefaultBaseURL("anthropic"),
        client: anthropicClient,
      };
    }
  }

  // Google Provider
  if (process.env.GOOGLE_API_KEY) {
    const models = parseModelsList(process.env.GOOGLE_MODELS, [
      "gemini-1.5-flash",
    ]);
    const googleClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    for (const modelName of models) {
      MODELS[modelName] = {
        name: modelName,
        provider: "google",
        providerName: "Google",
        apiKey: process.env.GOOGLE_API_KEY,
        baseURL: getDefaultBaseURL("google"),
        client: googleClient,
      };
    }
  }

  // Custom OpenAI-Compatible Providers (1-10)
  for (let i = 1; i <= 10; i++) {
    const baseURL = process.env[`CUSTOM_PROVIDER_${i}_BASE_URL`];
    if (!baseURL) continue;

    const apiKey =
      process.env[`CUSTOM_PROVIDER_${i}_API_KEY`] ||
      process.env.OPENAI_API_KEY ||
      "";
    const models = parseModelsList(
      process.env[`CUSTOM_PROVIDER_${i}_MODELS`],
      [],
    );

    if (models.length === 0) continue;

    const providerName =
      process.env[`CUSTOM_PROVIDER_${i}_NAME`] || extractProviderName(baseURL);
    const customClient = new OpenAI({
      apiKey,
      baseURL,
    });

    for (const modelName of models) {
      MODELS[modelName] = {
        name: modelName,
        provider: "openai",
        providerName,
        apiKey,
        baseURL,
        client: customClient,
      };
    }
  }

  return MODELS;
}

// Build the model registry
const MODELS = buildProviderRegistry();

// =============================================================================
// Model Lookup Helper
// =============================================================================
function getModelConfig(model: string): ModelConfig | null {
  return MODELS[model] || null;
}

// =============================================================================
// Default Model Helper
// =============================================================================
function getDefaultOrFirstModel(): string {
  if (process.env.DEFAULT_MODEL) return process.env.DEFAULT_MODEL;
  const availableModels = Object.keys(MODELS);
  if (availableModels.length === 0) {
    throw new Error(
      "No AI providers configured. Please set up at least one provider in your environment.",
    );
  }
  return availableModels[0];
}

// =============================================================================
// Swagger Configuration
// =============================================================================

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Lubb Writer API",
      version: API_VERSION,
      description:
        "AI-powered text enhancement API with multiple provider support (OpenAI, Anthropic Claude, Google Gemini)",
      contact: {
        name: "Adel Benyahia",
        email: "contact@adelpro.us.kg",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "apiKey",
          name: "Authorization",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your API token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/server.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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
// Swagger Documentation
// =============================================================================

const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Lubb Writer API Documentation",
  explorer: true,
};

app.use("/docs", swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions));
app.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/docs", swaggerUi.setup(swaggerSpec, swaggerUiOptions));

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
// Helper Function: Strip Thinking Blocks
// =============================================================================
function cleanThinkingBlocks(text: string): string {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<思考>[\s\S]*?<\/思考>/gi, "")
    .replace(/^(\s*)(thinking|thoughts?)[:\s].*/gim, "");

  return cleaned.trim();
}

// =============================================================================
// AI Chat Function
// =============================================================================
async function chatWithAI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
) {
  const config = getModelConfig(model);

  if (!config) {
    throw new Error(`Model ${model} not found or not configured`);
  }

  if (config.provider === "openai") {
    const client = config.client as OpenAI;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const rawResult = response.choices[0]?.message?.content || "";
    return {
      result: cleanThinkingBlocks(rawResult),
      model: model,
      usage: response.usage,
    };
  }

  if (config.provider === "anthropic") {
    const client = config.client as Anthropic;
    const response = await client.messages.create({
      model: model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawResult =
      response.content[0].type === "text" ? response.content[0].text : "";
    return {
      result: cleanThinkingBlocks(rawResult),
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
    const client = config.client as GoogleGenerativeAI;
    const genModel = client.getGenerativeModel({ model: model });

    const result = await genModel.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const response = result.response;

    return {
      result: cleanThinkingBlocks(response.text()),
      model: model,
      usage: null,
    };
  }

  throw new Error(`Unknown provider for model ${model}`);
}

// =============================================================================
// Routes
// =============================================================================

const startTime = Date.now();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API including version, uptime, and timestamp
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 uptime:
 *                   type: integer
 *                   description: Server uptime in seconds
 *                   example: 3600
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 */
app.get("/health", (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    status: "ok",
    version: API_VERSION,
    uptime: uptime,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /models:
 *   get:
 *     summary: List available AI models
 *     description: Returns all configured AI models with their provider information. Only includes models that are properly configured in the environment.
 *     tags:
 *       - Models
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Model identifier
 *                         example: "gpt-4o"
 *                       provider:
 *                         type: string
 *                         description: Provider type (openai, anthropic, google)
 *                         example: "openai"
 *                       providerName:
 *                         type: string
 *                         description: Display name of the provider
 *                         example: "OpenAI"
 *                       baseURL:
 *                         type: string
 *                         description: API endpoint URL for this model
 *                         example: "https://api.openai.com/v1"
 *                   example:
 *                     - name: "gpt-4o"
 *                       provider: "openai"
 *                       providerName: "OpenAI"
 *                       baseURL: "https://api.openai.com/v1"
 *                     - name: "MiniMax-M2.1"
 *                       provider: "openai"
 *                       providerName: "MiniMax"
 *                       baseURL: "https://api.minimax.io/v1"
 *                     - name: "claude-3-5-sonnet"
 *                       provider: "anthropic"
 *                       providerName: "Anthropic"
 *                       baseURL: "https://api.anthropic.com"
 */
app.get("/models", (req, res) => {
  const availableModels = Object.values(MODELS).map((config) => ({
    name: config.name,
    provider: config.provider,
    providerName: config.providerName,
    baseURL: config.baseURL,
  }));
  res.json({ models: availableModels });
});

/**
 * @openapi
 * /enhance:
 *   post:
 *     summary: Enhance text using AI
 *     description: Transform text using predefined enhancement modes (rewrite, summarize, humanize, etc.) or custom prompts
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to enhance
 *                 example: "This is a sample text that needs enhancement"
 *               mode:
 *                 type: string
 *                 description: Predefined enhancement mode (optional if prompt is provided)
 *                 enum: [rewrite, summarize, humanize, grammar, formal, casual, academic, seo, persuasive, creative, twitter, linkedin, story]
 *                 example: "humanize"
 *               prompt:
 *                 type: string
 *                 description: Custom prompt instruction (optional if mode is provided)
 *                 example: "Make it more engaging and professional"
 *               model:
 *                 type: string
 *                 description: AI model to use (defaults to first available model)
 *                 example: "gpt-4o"
 *     responses:
 *       200:
 *         description: Enhanced text result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   description: The enhanced text
 *                   example: "Here's a much better version of your text..."
 *                 model:
 *                   type: string
 *                   example: "gpt-4o"
 *                 usage:
 *                   type: object
 *                   properties:
 *                     prompt_tokens:
 *                       type: integer
 *                       example: 150
 *                     completion_tokens:
 *                       type: integer
 *                       example: 200
 *                     total_tokens:
 *                       type: integer
 *                       example: 350
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     - "Text is required"
 *                     - "Prompt or mode is required"
 *       401:
 *         description: Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing API token"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "AI rate limit exceeded, please try again later."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to enhance text"
 */
app.post("/enhance", authenticate, async (req, res) => {
  try {
    const { prompt, text, model, customPrompt } = req.body;

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

    if (customPrompt) {
      fullPrompt = `${fullPrompt}. Additional instructions: ${customPrompt}`;
    }

    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const systemPrompt = `You are a writing enhancement assistant. Your ONLY task is to improve the provided text according to the instruction. Return ONLY the enhanced text, nothing else. Do not include any explanations, meta-commentary, or the original instruction in your response. Output only the improved version of the text.`;

    const userMessage = `<instruction>
${fullPrompt}
</instruction>

<content>
${text}
</content>

Return ONLY the enhanced content. Do not include the instruction text itself in your response.`;

    const result = await chatWithAI(chatModel, systemPrompt, userMessage);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to enhance text";
    console.error("Error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /custom:
 *   post:
 *     summary: Process text with custom prompt
 *     description: Send custom instructions to process the text according to specific requirements
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - prompt
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to process
 *                 example: "Original text content that needs special processing"
 *               prompt:
 *                 type: string
 *                 description: Custom processing instructions
 *                 example: "Translate to Spanish and make it formal"
 *               model:
 *                 type: string
 *                 description: AI model to use (defaults to first available model)
 *                 example: "claude-3-5-sonnet"
 *     responses:
 *       200:
 *         description: Processed text result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   description: The processed text
 *                   example: "Translated and formatted text result..."
 *                 model:
 *                   type: string
 *                   example: "claude-3-5-sonnet"
 *                 usage:
 *                   type: object
 *                   properties:
 *                     prompt_tokens:
 *                       type: integer
 *                     completion_tokens:
 *                       type: integer
 *                     total_tokens:
 *                       type: integer
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Text and prompt are required"
 *       401:
 *         description: Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing API token"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "AI rate limit exceeded, please try again later."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to process text"
 */
app.post("/custom", authenticate, async (req, res) => {
  try {
    const { prompt, text, model } = req.body;

    if (!text || !prompt) {
      return res.status(400).json({ error: "Text and prompt are required" });
    }

    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const systemPrompt = `You are a text processing assistant. Your task is to process text according to specific instructions. Return ONLY the result. Do not include explanations, instructions, or any meta-commentary. Output only the processed text.`;

    const userMessage = `<task>
Process the following text according to these instructions:
${prompt}
</task>

<text>
${text}
</text>

Return ONLY the processed result. Do not repeat the instructions or include any other content.`;

    const result = await chatWithAI(chatModel, systemPrompt, userMessage);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process text";
    console.error("Error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /prompts:
 *   get:
 *     summary: List available prompt templates
 *     description: Returns all predefined enhancement modes and their instructions for use with the /enhance endpoint
 *     tags:
 *       - Configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available prompts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *               example:
 *                 rewrite: "Rewrite this text to be clearer, more engaging, and human-sounding. Avoid AI patterns..."
 *                 summarize: "Summarize this text concisely. Keep only key facts..."
 *                 humanize: "Humanize this text - remove all signs of AI writing..."
 *                 grammar: "Fix any grammar, spelling, and punctuation errors..."
 *                 formal: "Convert to formal, professional tone..."
 *                 casual: "Convert to casual, friendly tone..."
 *                 academic: "Rewrite in formal academic style..."
 *                 seo: "Optimize for search engines..."
 *                 persuasive: "Rewrite as a compelling persuasive argument..."
 *                 creative: "Add creative flair..."
 *                 twitter: "Shorten to under 280 characters..."
 *                 linkedin: "Format as a professional LinkedIn post..."
 *                 story: "Convert into a short narrative..."
 */
app.get("/prompts", authenticate, (req, res) => {
  res.json(DEFAULT_PROMPTS);
});

/**
 * @openapi
 * /enhance/rewrite:
 *   post:
 *     summary: Rewrite text
 *     description: Rewrite text to be clearer, more engaging, and human-sounding while avoiding AI patterns
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to rewrite
 *                 example: "This is a sample text that needs to be rewritten for better clarity and engagement."
 *               model:
 *                 type: string
 *                 description: AI model to use
 *                 example: "MiniMax-M2.1"
 *     responses:
 *       200:
 *         description: Rewritten text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/rewrite", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.rewrite, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to rewrite text";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/summarize:
 *   post:
 *     summary: Summarize text
 *     description: Summarize text concisely, keeping only key facts with no filler phrases
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to summarize
 *                 example: "A very long article with lots of details that needs to be summarized."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Summarized text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/summarize", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.summarize, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to summarize text";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/humanize:
 *   post:
 *     summary: Humanize text
 *     description: Remove all signs of AI writing and add personality and voice
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The AI-generated text to humanize
 *                 example: "In today's rapidly evolving technological landscape, artificial intelligence has emerged as a pivotal force..."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Humanized text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/humanize", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.humanize, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to humanize text";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/grammar:
 *   post:
 *     summary: Fix grammar
 *     description: Fix grammar, spelling, and punctuation errors while preserving author's voice
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text with grammar issues
 *                 example: "Their going too the store tommorow."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Corrected text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/grammar", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.grammar, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fix grammar";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/formal:
 *   post:
 *     summary: Convert to formal tone
 *     description: Convert text to formal, professional tone with precise language
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The casual text to convert
 *                 example: "Hey guys, we should totally rock this meeting tomorrow!"
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Formal text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/formal", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.formal, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert to formal tone";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/casual:
 *   post:
 *     summary: Convert to casual tone
 *     description: Convert text to casual, friendly tone with personality
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The formal text to convert
 *                 example: "I would like to schedule a meeting at your earliest convenience."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Casual text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/casual", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.casual, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert to casual tone";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/academic:
 *   post:
 *     summary: Convert to academic style
 *     description: Rewrite text in formal academic style with precise terminology and citations
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The informal text to convert
 *                 example: "A lot of people think social media is bad for kids."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Academic text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/academic", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.academic, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert to academic style";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/seo:
 *   post:
 *     summary: Optimize for SEO
 *     description: Optimize text for search engines with relevant keywords and structure
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to optimize
 *                 example: "Our company provides excellent web hosting services for businesses."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: SEO-optimized text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/seo", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.seo, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to optimize for SEO";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/persuasive:
 *   post:
 *     summary: Make persuasive
 *     description: Rewrite text as a compelling persuasive argument with strong calls to action
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to make persuasive
 *                 example: "You should consider using our product because it has many features."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Persuasive text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/persuasive", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(
      chatModel,
      DEFAULT_PROMPTS.persuasive,
      text,
    );
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to make text persuasive";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/creative:
 *   post:
 *     summary: Add creative flair
 *     description: Add creative flair with vivid metaphors and engaging descriptions
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The plain text to make creative
 *                 example: "The meeting was long and boring."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Creative text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/creative", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.creative, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add creative flair";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/twitter:
 *   post:
 *     summary: Convert to Twitter format
 *     description: Shorten text to under 280 characters for Twitter
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The long text to shorten
 *                 example: "Our company announced today that we will be launching a revolutionary new product line next month that will transform the way people work and communicate with each other."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Twitter-ready text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/twitter", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.twitter, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert to Twitter format";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/linkedin:
 *   post:
 *     summary: Convert to LinkedIn format
 *     description: Format text as a professional LinkedIn post
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content to format for LinkedIn
 *                 example: "We just released our quarterly results showing 50% growth."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: LinkedIn-formatted post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/linkedin", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.linkedin, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert to LinkedIn format";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @openapi
 * /enhance/story:
 *   post:
 *     summary: Convert to narrative
 *     description: Convert text into an engaging short narrative with characters and plot
 *     tags:
 *       - Text Enhancement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content to convert into a story
 *                 example: "The company faced challenges but eventually succeeded."
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Story narrative
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 */
app.post("/enhance/story", authenticate, async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const chatModel = model || process.env.DEFAULT_MODEL || getDefaultOrFirstModel();
    const result = await chatWithAI(chatModel, DEFAULT_PROMPTS.story, text);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert to story format";
    res.status(500).json({ error: errorMessage });
  }
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
║   Docs: http://localhost:${PORT}/docs                  ║
╚═══════════════════════════════════════════════════╝
  `);
});
