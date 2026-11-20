import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { generateResponse } from "./services/aiService.js";
import { validateImage, toBase64 } from "./services/imageService.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use("/api/", limiter);

const conversations = new Map();

app.post("/api/chat", upload.single("image"), async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required." });
    }

    let imageBase64 = null;
    let imageMimeType = null;

    if (req.file) {
      validateImage(req.file);
      imageBase64 = toBase64(req.file.buffer);
      imageMimeType = req.file.mimetype;
    }

    const history = conversations.get(conversationId) || [];

    const reply = await generateResponse({
      history,
      message: message.trim(),
      imageBase64,
      imageMimeType,
    });

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
