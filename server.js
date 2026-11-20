import express from "express";

const app = express();
app.use(express.static("public"));

app.get("/api/test", (req, res) => {
  res.json({ message: "سرور کار می‌کند!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
