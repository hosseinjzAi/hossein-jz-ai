import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use("/api/", limiter);

const conversations = new Map();

// کلید جدیدت
const API_KEY = "1xai-dPUL-JjHJ7TaumxUsM7p1QhnoCZDbTvL1jCkeCPCvs";
const BASE_URL = "https://1xai.ir/v1";
const MODEL = "gpt-4o-mini"; 

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
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("1xAi Error:", response.status, errorData);
      throw new Error(`1xAi Error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    console.log("Response received from 1xAi.");

    history.push({ role: "user", content: message.trim() });
    history.push({ role: "assistant", content: reply });
    conversations.set(conversationId, history.slice(-20));

    res.json({ reply, conversationId });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "AI request failed." });
  }
});

app.post("/api/clear", (req, res) => {
  const { conversationId } = req.body;
  conversations.delete(conversationId);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HOSSEIN JZ AI running on port ${PORT}`));
