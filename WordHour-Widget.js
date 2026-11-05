async function main() {
// Word Hour — Scriptable iOS Home Screen Widget
// Save the exported words.json at: iCloud Drive/Scriptable/WordHour/words.json
// iOS decides the actual refresh timing; this requests a refresh about every hour.

const fm = FileManager.iCloud();
const folder = fm.joinPath(fm.documentsDirectory(), "WordHour");
const file = fm.joinPath(folder, "words.json");

if (!fm.fileExists(folder)) fm.createDirectory(folder);
if (!fm.fileExists(file)) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#292a3a");
  const t = w.addText("Word Hour");
  t.textColor = Color.white(); t.font = Font.boldSystemFont(18);
  w.addSpacer(8);
  const p = w.addText("Сначала сохрани words.json в папку Scriptable/WordHour в iCloud Drive.");
  p.textColor = new Color("#d5d5e5"); p.font = Font.systemFont(11); p.minimumScaleFactor = 0.7;
  Script.setWidget(w); Script.complete(); return;
}

await fm.downloadFileFromiCloud(file);
const data = JSON.parse(fm.readString(file));
const words = data.words || [];
const widget = new ListWidget();
widget.backgroundColor = new Color("#292a3a");
widget.setPadding(16, 17, 15, 17);

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function shuffle(items, seed) {
  const a = [...items]; let x = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function localHourKey(d = new Date()) {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 3600000);
}

const label = widget.addText("WORD OF THE HOUR");
label.textColor = new Color("#bdbdd1");
label.font = Font.semiboldSystemFont(8);
label.letterSpacing = 1.5;
widget.addSpacer(16);

if (!words.length) {
  const empty = widget.addText("Добавь слова в Word Hour");
  empty.textColor = Color.white(); empty.font = Font.boldSystemFont(18);
} else {
  const elapsed = Math.max(0, localHourKey() - (data.startHour || localHourKey()));
  const cycle = Math.floor(elapsed / words.length);
  const pos = elapsed % words.length;
  const order = shuffle(words, hashSeed(String(data.seed) + "-" + cycle));
  const word = order[pos];
  const title = widget.addText(word.word || "Word");
  title.textColor = Color.white();
  title.font = Font.boldSystemFont(25);
  title.minimumScaleFactor = 0.65;
  title.lineLimit = 2;
  widget.addSpacer(5);
  const translation = data.language === "uk" ? (word.uk || word.translation || "") : (word.translation || word.uk || "");
  const meaning = widget.addText(translation);
  meaning.textColor = new Color("#d2d1e2");
  meaning.font = Font.systemFont(13);
  meaning.minimumScaleFactor = 0.7;
  meaning.lineLimit = 2;
  if (word.phonetic) {
    widget.addSpacer(5);
    const phon = widget.addText(word.phonetic);
    phon.textColor = new Color("#aaaac2"); phon.font = Font.systemFont(10);
  }
}
widget.addSpacer();
const footer = widget.addStack();
const brand = footer.addText("WORD HOUR");
brand.textColor = new Color("#aaaac2"); brand.font = Font.semiboldSystemFont(8); brand.letterSpacing = 1;
footer.addSpacer();
const arrow = footer.addText("↗");
arrow.textColor = new Color("#c5c4e0"); arrow.font = Font.systemFont(13);
widget.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000);
Script.setWidget(widget);
Script.complete();
}
main().catch(e => { console.error(e); Script.complete(); });
