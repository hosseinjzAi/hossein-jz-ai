import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import OpenAI from "openai"; // مستقیم اینجا ایمپورت می‌کنیم

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use("/api/", limiter);

const conversations = new Map();

// ساخت کلاینت با کلید مستقیم
const client = new OpenAI({
  apiKey: "1xai-6RbRhJ_Dj1m68w-smhRJ5y28-tN4Hdgq6In0D_XI_8",
  baseURL: "https://1xai.ir/v1",
});

app.post("/api/chat", upload.single("image"), async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required." });
    }

    let imageBase64 = null;
    let imageMimeType = null;

    if (req.file) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Invalid image type." });
      }
      imageBase64 = req.file.buffer.toString("base64");
      imageMimeType = req.file.mimetype;
    }

    const history = conversations.get(conversationId) || [];

    // ساخت پیام‌ها
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const userContent = [{ type: "text", text: message.trim() }];
    if (imageBase64 && imageMimeType) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
      });
    }
    messages.push({ role: "user", content: userContent });

    console.log("Sending request to 1xAi...");
    
    // درخواست به 1xAi
    const response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: messages,
      max_tokens: 2000,
    });

    console.log("Response received from 1xAi.");

    const reply = response.choices[0].message.content;

    history.push({ role: "user", content: message.trim() });
    history.push({ role: "assistant", content: reply });
    conversations.set(conversationId, history.slice(-20));

    res.json({ reply, conversationId });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message || "AI request failed." });
  }
});

app.post("/api/clear", (req, res) => {
  const { conversationId } = req.body;
  conversations.delete(conversationId);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HOSSEIN JZ AI running on port ${PORT}`));
