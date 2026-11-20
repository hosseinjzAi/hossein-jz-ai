export function validateImage(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.mimetype)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  const maxBytes = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image must be under ${process.env.MAX_FILE_SIZE_MB || 10}MB.`);
  }
}

export function toBase64(buffer) {
  return buffer.toString("base64");
}
