import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { analytics: [] });
await db.read();
db.data ||= { analytics: [] };

app.use(express.static(__dirname));

function computeMetrics(items) {
  const total = items.length;
  let correctVotes = 0, voteTotal = 0;
  let concernSum = 0, concernCount = 0;
  let pay = { Yes: 0, No: 0, Maybe: 0 };
  let roles = {};
  items.forEach(r => {
    if (Array.isArray(r.deepfakeAnswers)) {
      voteTotal += r.deepfakeAnswers.length;
      correctVotes += r.deepfakeAnswers.filter(a => a.correct).length;
    }
    if (typeof r.concernLevel === "number") {
      concernSum += r.concernLevel;
      concernCount += 1;
    }
    if (r.willingnessToPay && pay[r.willingnessToPay] !== undefined) {
      pay[r.willingnessToPay] += 1;
    }
    const role = r.role || r.user?.role;
    if (role) roles[role] = (roles[role] || 0) + 1;
  });
  const accuracy = voteTotal ? Math.round((correctVotes / voteTotal) * 100) : 0;
  const concernAvg = concernCount ? (concernSum / concernCount) : 0;
  return { total, accuracy, concernAvg, pay, roles };
}

const excelFile = path.join(__dirname, "analytics.xlsx");
if (!fs.existsSync(excelFile)) {
  const wbInit = XLSX.utils.book_new();
  const header = [["id","ts","role","user_name","user_email","accuracy","concern","damage","would_use","pay","encounter","scan_label","scan_score","b2b_verify","b2b_damage","b2b_api","b2b_size","b2b_demo"]];
  const wsInit = XLSX.utils.aoa_to_sheet(header);
  XLSX.utils.book_append_sheet(wbInit, wsInit, "Analytics");
  XLSX.writeFile(wbInit, excelFile);
}
function appendExcel(record) {
  let workbook;
  if (fs.existsSync(excelFile)) {
    workbook = XLSX.readFile(excelFile);
  } else {
    workbook = XLSX.utils.book_new();
    const header = [["id","ts","role","user_name","user_email","accuracy","concern","damage","would_use","pay","encounter","scan_label","scan_score","b2b_verify","b2b_damage","b2b_api","b2b_size","b2b_demo"]];
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(workbook, ws, "Analytics");
    XLSX.writeFile(workbook, excelFile);
  }
  const ws = workbook.Sheets["Analytics"] || XLSX.utils.aoa_to_sheet([[]]);
  if (!workbook.Sheets["Analytics"]) {
    XLSX.utils.book_append_sheet(workbook, ws, "Analytics");
  }
  const totalVotes = (record.deepfakeAnswers || []).length;
  const correctVotes = (record.deepfakeAnswers || []).filter(a => a.correct).length;
  const acc = totalVotes ? Math.round((correctVotes / totalVotes) * 100) : "";
  const row = [
    record.id,
    record.ts,
    record.role || record.user?.role || "",
    record.user?.name || "",
    record.user?.email || "",
    acc,
    record.concernLevel ?? "",
    record.damageLevel ?? "",
    record.wouldUseTool ?? "",
    record.willingnessToPay ?? "",
    record.encounterLevel ?? "",
    record.productScan?.label ?? "",
    record.productScan?.score ?? "",
    record.b2b?.verify ?? "",
    record.b2b?.damage ?? "",
    record.b2b?.api ?? "",
    record.b2b?.size ?? "",
    record.b2b?.demo ?? ""
  ];
  XLSX.utils.sheet_add_aoa(ws, [row], { origin: -1 });
  XLSX.writeFile(workbook, excelFile);
}

app.post("/api/analytics", async (req, res) => {
  const body = req.body || {};
  const record = {
    id: nanoid(),
    ts: new Date().toISOString(),
    deepfakeAnswers: body.deepfakeAnswers || [],
    encounterLevel: body.encounterLevel ?? null,
    concernLevel: body.concernLevel ?? null,
    damageLevel: body.damageLevel ?? null,
    wouldUseTool: body.wouldUseTool ?? null,
    willingnessToPay: body.willingnessToPay ?? null,
    role: body.role ?? null,
    b2b: body.b2b || {},
    productScan: body.productScan || {},
    user: body.user || {}
  };
  db.data.analytics.push(record);
  await db.write();
  try { appendExcel(record); } catch (e) { console.warn("Excel append failed", e); }
  res.json({ ok: true, id: record.id });
});

app.get("/api/metrics", async (_req, res) => {
  const metrics = computeMetrics(db.data.analytics);
  res.json(metrics);
});

app.get("/api/analytics.xlsx", async (_req, res) => {
  res.sendFile(excelFile, err => {
    if (err) res.status(404).json({ error: "Excel file not found yet" });
  });
});

app.get("/api/seed", async (_req, res) => {
  const record = {
    id: nanoid(),
    ts: new Date().toISOString(),
    deepfakeAnswers: [
      { index: 0, choice: "Real", correct: false },
      { index: 1, choice: "Real", correct: true }
    ],
    encounterLevel: 2,
    concernLevel: 7,
    damageLevel: 8,
    wouldUseTool: "Yes",
    willingnessToPay: "Maybe",
    role: "Professional",
    b2b: { verify: "No", damage: "No", api: "No", size: "1–10", demo: "No" },
    productScan: { score: 82, label: "Real", explain: "Stable lighting" },
    user: { name: "Seed User", email: "seed@example.com", role: "Professional" }
  };
  db.data.analytics.push(record);
  await db.write();
  try { await appendExcel(record); } catch (e) { console.warn("Excel append failed", e); }
  res.json({ ok: true, id: record.id });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Truth AI backend running at http://localhost:${port}/`);
});
