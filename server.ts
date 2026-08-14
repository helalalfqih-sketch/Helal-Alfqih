import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return aiClient;
}

// AI Search Endpoint
app.post("/api/ai-search", async (req, res) => {
  try {
    const { query, products } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "الرجاء إدخال نص للبحث" });
    }

    const client = getAIClient();
    if (!client) {
      // Return smart keyword fallback if API key is not configured
      return res.json({
        aiSummary: `بحث إندكس الذكي: جاري عرض نتائج مخصصة للاستعلام "${query}".`,
        suggestedCategories: ["all"],
        query,
      });
    }

    const systemPrompt = `أنت مساعد تسوق ذكي لخبير منتجات ومتجر "إندكس ستور" (INDEXES STORE) في اليمن.
يقوم العميل بالبحث بلغة طبيعية مثل "أريد سماعة بعزل ضوضاء للمكالمات" أو "عطر فاخر للمناسبات" أو "ساعة ضد الماء".

لديك قائمة منتجات المتجر التالية بالصيغة JSON:
${JSON.stringify(
  (products || []).map(
    (p: {
      id?: unknown;
      name?: unknown;
      subtitle?: unknown;
      description?: unknown;
      category?: unknown;
      priceYER?: unknown;
      specs?: unknown;
    }) => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      category: p.category,
      priceYER: p.priceYER,
      specs: p.specs,
    }),
  ),
  null,
  2,
)}

بناءً على طلب العميل: "${query}"

المطلوب إرجاع إجابة JSON بالشكل التالي حصراً وبدون أي نص آخر:
{
  "matchedProductIds": ["قائمة بالمُعرفات المطابقة تماماً للمواصفات"],
  "aiSummary": "ملخص عربي احترافي وجذاب يشرح لماذا تناسب هذه المنتجات طلب العميل تحديداً",
  "recommendedKeywords": ["الكلمة المفتاحية 1", "الكلمة المفتاحية 2"]
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    return res.json(parsedData);
  } catch (error: unknown) {
    console.error("AI Search Error:", error);
    return res.status(500).json({
      error: "حدث خطأ أثناء المعالجة بواسطة الذكاء الاصطناعي",
      aiSummary:
        "نعتذر، تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً. سنعرض النتائج بالطريقة المباشرة.",
    });
  }
});

// Orders Endpoint
app.post("/api/orders", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const {
      items,
      customer,
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      notes,
      couponCode,
      paymentProvider,
      idempotencyKey,
    } = req.body || {};

    const name = customerName || customer?.name || customer?.customerName || req.body?.name;
    const phone = customerPhone || customer?.phone || customer?.customerPhone || req.body?.phone;
    const address =
      customerAddress || customer?.address || customer?.customerAddress || req.body?.address;
    const email = customerEmail || customer?.email || customer?.customerEmail || req.body?.email;
    const orderNotes = notes || customer?.notes || req.body?.deliveryInstruction;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "قائمة المنتجات مطلوبة" });
    }

    // Build payload without price, total, or user_id from client
    const payload = {
      items: items.map((it: Record<string, unknown>) => {
        const prodObj = typeof it.product === "object" && it.product ? (it.product as any) : null;
        const pId = String(
          it.productId ||
          it.id ||
          it.product_id ||
          prodObj?.id ||
          it.productName ||
          ""
        );
        return {
          productId: pId,
          quantity: Number(it.quantity || 1),
        };
      }),
      customerName: String(name || "").trim(),
      customerPhone: String(phone || "").trim(),
      customerAddress: String(address || "").trim(),
      customerEmail: email ? String(email).trim() : undefined,
      notes: orderNotes ? String(orderNotes).trim() : undefined,
      couponCode: couponCode ? String(couponCode).trim() : undefined,
      paymentProvider: paymentProvider || req.body?.paymentMethod
        ? String(paymentProvider || req.body?.paymentMethod).trim()
        : undefined,
      idempotencyKey: idempotencyKey
        ? String(idempotencyKey).trim()
        : undefined,
    };

    const { createOrderService } = await import(
      "./src/services/order-creation.service"
    );

    const result = await createOrderService(payload, {
      authHeader,
      req,
    });

    return res.json({
      orderId: result.orderId,
      total: result.total,
      currency: result.currency,
      itemsCount: result.itemsCount,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    const errObj = error as {
      status?: number;
      statusCode?: number;
      response?: { status?: number };
      message?: string;
    } | null;
    const status =
      errObj?.status || errObj?.statusCode || errObj?.response?.status || 500;
    const message = errObj?.message || "حدث خطأ أثناء إنشاء الطلب";
    return res.status(status).json({ error: message });
  }
// TanStack Start Server Handler for /_server and /_serverFn
app.all(["/_server*", "/_serverFn*"], async (req, res, next) => {
  try {
    const url = new URL(
      req.originalUrl || req.url,
      `http://${req.headers.host || "localhost:3000"}`
    );

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body && typeof req.body === "object") {
        init.body = JSON.stringify(req.body);
      } else if (typeof req.body === "string") {
        init.body = req.body;
      }
    }

    const webRequest = new Request(url.href, init);
    const serverModule = await import("./src/server");
    const serverHandler = serverModule.default || serverModule;

    const webResponse = await serverHandler.fetch(webRequest, process.env, {});

    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await webResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Error handling /_server route:", err);
    next(err);
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
