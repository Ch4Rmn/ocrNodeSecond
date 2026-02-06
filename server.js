const express = require("express");
const multer = require("multer");
const fs = require("fs");
const XLSX = require("xlsx");
const Tesseract = require("tesseract.js");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ✅ OCR Extract Text API
app.post("/extract-text", upload.single("image"), async (req, res) => {
  const filePath = req.file.path;

  try {
    const { data } = await Tesseract.recognize(filePath, "mya+eng");

    res.json({
      text: data.text,
    });
  } catch (err) {
    res.status(500).json({ error: "OCR Failed" });
  } finally {
    fs.unlinkSync(filePath);
  }
});

// ✅ Convert Edited Text → Excel API
app.post("/convert-excel", (req, res) => {
  const text = req.body.text;

  if (!text) return res.status(400).json({ error: "No text provided" });

  // Split lines
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Create Excel sheet
  const wsData = [["Text"], ...lines.map((line) => [line])];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "OCR Result");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=ocr_output.xlsx");

  res.send(buffer);
});

const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log("Running on http://localhost:" + PORT));
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});