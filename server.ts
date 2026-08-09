import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  aiClient = new GoogleGenAI({ apiKey });
}

// AI Search Endpoint
app.post("/api/ai-search", async (req, res) => {
  try {
    const { query, products } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "الرجاء إدخال نص للبحث" });
    }

    if (!aiClient) {
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
  (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    category: p.category,
    priceYER: p.priceYER,
    specs: p.specs,
  })),
  null,
  2
)}

بناءً على طلب العميل: "${query}"

المطلوب إرجاع إجابة JSON بالشكل التالي حصراً وبدون أي نص آخر:
{
  "matchedProductIds": ["قائمة بالمُعرفات المطابقة تماماً للمواصفات"],
  "aiSummary": "ملخص عربي احترافي وجذاب يشرح لماذا تناسب هذه المنتجات طلب العميل تحديداً",
  "recommendedKeywords": ["الكلمة المفتاحية 1", "الكلمة المفتاحية 2"]
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI Search Error:", error);
    return res.status(500).json({
      error: "حدث خطأ أثناء المعالجة بواسطة الذكاء الاصطناعي",
      aiSummary: "نعتذر، تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً. سنعرض النتائج بالطريقة المباشرة.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
