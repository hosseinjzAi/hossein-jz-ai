const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const micBtn = document.getElementById("micBtn");
const newChatBtn = document.getElementById("newChat");
const themeToggle = document.getElementById("themeToggle");

let conversationId = crypto.randomUUID();
let selectedImage = null;

themeToggle.onclick = () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
};

imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (file) {
    selectedImage = file;
    imagePreview.textContent = `📎 ${file.name}`;
  }
};

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text && !selectedImage) return;

  appendMessage("user", text || "[Image]");
  inputEl.value = "";
  imagePreview.textContent = "";

  const formData = new FormData();
  formData.append("message", text || "Describe this image.");
  formData.append("conversationId", conversationId);
  if (selectedImage) formData.append("image", selectedImage);

  selectedImage = null;
  imageInput.value = "";

  const loadingEl = appendMessage("assistant", "▌");
  const loadingText = loadingEl.querySelector(".content");

  try {
    const res = await fetch("/api/chat", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    loadingText.innerHTML = marked.parse(data.reply);
    loadingText.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  } catch (err) {
    loadingText.textContent = "Error: " + err.message;
  }
}

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  const content = document.createElement("div");
  content.className = "content";
  content.textContent = text;
  div.appendChild(content);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

sendBtn.onclick = sendMessage;
inputEl.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

newChatBtn.onclick = async () => {
  await fetch("/api/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });
  conversationId = crypto.randomUUID();
  messagesEl.innerHTML = "";
};

micBtn.onclick = () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "fa-IR";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    inputEl.value = event.results[0][0].transcript;
  };
  recognition.onerror = (e) => alert("Voice error: " + e.error);
  recognition.start();
};
