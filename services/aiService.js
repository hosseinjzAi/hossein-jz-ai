import OpenAI from "openai";

export async function generateResponse({ history, message, imageBase64, imageMimeType }) {
  const client = new OpenAI({
    apiKey: process.env.ONEXAI_API_KEY,
    baseURL: "https://1xai.ir/v1",
  });

  const messages = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const userContent = [{ type: "text", text: message }];
  
  if (imageBase64 && imageMimeType) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
    });
  }

  messages.push({ role: "user", content: userContent });

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: messages,
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}
