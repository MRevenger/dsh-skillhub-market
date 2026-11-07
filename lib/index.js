// project/src/host/routes.ts
import { spawn } from "node:child_process";
import { stat as stat3 } from "node:fs/promises";
import { join as join3 } from "node:path";

// project/src/host/api-map.ts
var SKILLHUB_API = "https://api.skillhub.cn";
var SKILLHUB_WEB = "https://skillhub.cn";
var SKILLS_PATH = "/api/skills";
var DOWNLOAD_PATH = "/api/v1/download";
var DETAIL_PATH = "/api/v1/skills";
var CATEGORIES_PATH = "/api/v1/categories";
var SORT_MAP = {
  all: {},
  trending: { sortBy: "score", order: "desc", fallbackNote: true },
  downloads: { sortBy: "downloads", order: "desc" },
  newest: { sortBy: "updated_at", order: "desc" }
};
var FALLBACK_CATEGORIES = [
  { key: "pay-skill", name: "Pay Skill", nameEn: "Pay Skill" },
  { key: "office-efficiency", name: "\u529E\u516C\u6548\u7387", nameEn: "Office Efficiency" },
  { key: "content-creation", name: "\u5185\u5BB9\u521B\u4F5C", nameEn: "Content Creation" },
  { key: "dev-programming", name: "\u5F00\u53D1\u7F16\u7A0B", nameEn: "Developer Tools" },
  { key: "data-analysis", name: "\u6570\u636E\u5206\u6790", nameEn: "Data Analysis" },
  { key: "design-media", name: "\u8BBE\u8BA1\u591A\u5A92\u4F53", nameEn: "Design & Media" },
  { key: "ai-agent", name: "AI Agent", nameEn: "AI Agent" },
  { key: "knowledge-management", name: "\u77E5\u8BC6\u7BA1\u7406", nameEn: "Knowledge Management" },
  { key: "business-ops", name: "\u5546\u4E1A\u8FD0\u8425", nameEn: "Business Operations" },
  { key: "education", name: "\u6559\u80B2\u5B66\u4E60", nameEn: "Education" },
  { key: "professional", name: "\u884C\u4E1A\u4E13\u4E1A", nameEn: "Professional" },
  { key: "it-ops-security", name: "IT \u8FD0\u7EF4\u4E0E\u5B89\u5168", nameEn: "IT Ops & Security" },
  { key: "life-service", name: "\u751F\u6D3B\u670D\u52A1", nameEn: "Life Services" }
];
function sortParams(sort) {
  return SORT_MAP[sort] ?? {};
}
function buildLabels(apiKey) {
  if (apiKey === "required") return "requires_api_key:true";
  if (apiKey === "none") return "requires_api_key:false";
  return void 0;
}
function clampInt(value, min, max) {
  const n = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(max, Math.max(min, n));
}
function buildListQuery(query) {
  const params = new URLSearchParams();
  params.set("page", String(clampInt(query.page, 1, 1e5)));
  params.set("pageSize", String(clampInt(query.pageSize, 1, 100)));
  const keyword = query.keyword.trim();
  if (keyword !== "") params.set("keyword", keyword);
  if (query.category !== "" && query.category !== "all") params.set("category", query.category);
  if (query.source !== "all") params.set("source", query.source);
  const labels = buildLabels(query.apiKey);
  if (labels !== void 0) params.set("labels", labels);
  const sort = sortParams(query.sort);
  if (sort.sortBy !== void 0) params.set("sortBy", sort.sortBy);
  if (sort.order !== void 0) params.set("order", sort.order);
  return params;
}
function listUrl(query) {
  return `${SKILLHUB_API}${SKILLS_PATH}?${buildListQuery(query).toString()}`;
}
function detailUrl(slug, namespace) {
  const base = `${SKILLHUB_API}${DETAIL_PATH}/${encodeURIComponent(slug)}`;
  return namespace === void 0 || namespace === "" ? base : `${base}?namespace=${encodeURIComponent(namespace)}`;
}
function downloadUrl(slug) {
  return `${SKILLHUB_API}${DOWNLOAD_PATH}?slug=${encodeURIComponent(slug)}`;
}
function skillhubDetailUrl(slug) {
  return `${SKILLHUB_WEB}/skills/${encodeURIComponent(slug)}`;
}
function displaySource(raw) {
  const source = typeof raw.source === "string" ? raw.source : "";
  const claimed = raw.claim_state != null ? raw.claim_state === "claimed" : raw.isAuthorVerified === true || raw.verified === true;
  return source === "clawhub" && claimed ? "community" : source;
}
function numberOr(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}
function toEpochMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value < 1e12 ? value * 1e3 : value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1e3 : n;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return void 0;
}
function isGithubUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && /^(www\.)?github\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}
function resolveGithubUrl(raw) {
  const candidates = [
    raw.upstream_url,
    raw.upstreamUrl,
    raw.sourceUrl,
    raw.source_url,
    raw.githubUrl,
    raw.repository,
    raw.homepage
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate !== "" && isGithubUrl(candidate)) return candidate;
  }
  return void 0;
}
function normalizeLabels(value) {
  const out = {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") out[key] = String(raw);
  }
  return out;
}
function normalizeTags(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === "string");
  if (value !== null && typeof value === "object") return Object.keys(value);
  return [];
}
function normalizeSubCategories(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const entry of value) {
    if (entry === null || typeof entry !== "object") continue;
    const item = entry;
    if (typeof item.key !== "string") continue;
    out.push({ key: item.key, name: typeof item.name === "string" ? item.name : item.key });
  }
  return out;
}
function firstString(...values) {
  for (const value of values) if (typeof value === "string" && value.trim() !== "") return value.trim();
  return "";
}
function normalizeSkill(rawValue) {
  const raw = rawValue !== null && typeof rawValue === "object" ? rawValue : {};
  const stats = raw.stats !== null && typeof raw.stats === "object" ? raw.stats : {};
  const namespace = raw.namespace !== null && typeof raw.namespace === "object" ? raw.namespace : {};
  const publisher = raw.publisher !== null && typeof raw.publisher === "object" ? raw.publisher : {};
  const slug = firstString(raw.slug, raw.id);
  const name2 = firstString(raw.name, raw.displayName, slug);
  const labels = normalizeLabels(raw.labels);
  const requiresApiKey = labels.requires_api_key === void 0 ? void 0 : labels.requires_api_key === "true";
  return {
    slug,
    name: name2,
    displayName: firstString(raw.displayName, raw.name, slug),
    description: firstString(raw.description, raw.summary, raw.summary_zh, raw.description_zh),
    descriptionZh: firstString(raw.description_zh, raw.summary_zh),
    category: firstString(raw.category),
    subCategories: normalizeSubCategories(raw.subCategories ?? raw.sub_categories),
    source: displaySource(raw),
    labels,
    downloads: numberOr(raw.downloads ?? stats.downloads, 0),
    stars: numberOr(raw.stars ?? stats.stars, 0),
    installs: numberOr(raw.installs ?? stats.installs, 0),
    requiresApiKey,
    updatedAt: toEpochMs(raw.updated_at ?? raw.updatedAt),
    createdAt: toEpochMs(raw.created_at ?? raw.createdAt),
    homepage: firstString(raw.homepage) || void 0,
    githubUrl: resolveGithubUrl(raw),
    skillhubUrl: skillhubDetailUrl(slug),
    iconUrl: firstString(raw.iconUrl, raw.icon_url) || void 0,
    version: firstString(raw.version, raw.latestVersion) || void 0,
    publisher: firstString(publisher.displayName, publisher.name, raw.ownerName) || void 0,
    namespaceHandle: firstString(namespace.handle, raw.upstream_owner_login, raw.githubAuthorLogin) || void 0,
    tags: normalizeTags(raw.tags),
    overviewMd: firstString(raw.overviewMd, raw.overview_md) || void 0
  };
}
function normalizeListPayload(payload) {
  const root = payload !== null && typeof payload === "object" ? payload : {};
  const data = root.data !== null && typeof root.data === "object" ? root.data : {};
  const rawItems = Array.isArray(data.skills) ? data.skills : Array.isArray(data.items) ? data.items : Array.isArray(root.skills) ? root.skills : [];
  return {
    items: rawItems.map(normalizeSkill),
    total: numberOr(data.total ?? root.total, rawItems.length),
    page: numberOr(data.page ?? root.page, 1),
    pageSize: numberOr(data.pageSize ?? root.pageSize, rawItems.length)
  };
}
function normalizeDetailPayload(payload) {
  const root = payload !== null && typeof payload === "object" ? payload : {};
  const data = root.data !== null && typeof root.data === "object" ? root.data : {};
  const raw = data.skill ?? root.skill ?? data;
  const skill = normalizeSkill(raw);
  const detailRaw = raw !== null && typeof raw === "object" ? raw : {};
  return {
    ...skill,
    overviewMd: skill.overviewMd ?? (firstString(detailRaw.overviewMd, detailRaw.overview_md) || void 0)
  };
}
function normalizeCategories(payload) {
  const root = payload !== null && typeof payload === "object" ? payload : {};
  const data = root.data !== null && typeof root.data === "object" ? root.data : {};
  const rawItems = Array.isArray(root.items) ? root.items : Array.isArray(data.items) ? data.items : [];
  const out = [];
  for (const entry of rawItems) {
    if (entry === null || typeof entry !== "object") continue;
    const item = entry;
    if (typeof item.key !== "string" || item.active === false) continue;
    out.push({
      key: item.key,
      name: firstString(item.name, item.key),
      nameEn: firstString(item.nameEn, item.name_en) || void 0
    });
  }
  if (out.length === 0) return FALLBACK_CATEGORIES.map((entry) => ({ ...entry }));
  return out;
}

// project/src/host/http.ts
var HttpError = class extends Error {
  code;
  status;
  constructor(message, code = "REQUEST_FAILED", status = 502) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
  }
};
async function readLimited(response, maxBytes) {
  const declared = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError("\u54CD\u5E94\u5185\u5BB9\u8FC7\u5927", "RESPONSE_TOO_LARGE");
  }
  if (response.body === null) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === void 0) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new HttpError("\u54CD\u5E94\u5185\u5BB9\u8FC7\u5927", "RESPONSE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
    }
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}
async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15e3;
  const maxBytes = options.maxBytes ?? 8 * 1024 * 1024;
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const name2 = error instanceof Error ? error.name : "";
    if (name2 === "TimeoutError" || name2 === "AbortError") {
      throw new HttpError("\u8BF7\u6C42 Skillhub \u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", "TIMEOUT", 504);
    }
    throw new HttpError(`\u65E0\u6CD5\u8FDE\u63A5 Skillhub\uFF1A${error instanceof Error ? error.message : String(error)}`, "NETWORK_ERROR");
  }
  const text = (await readLimited(response, maxBytes)).toString("utf8");
  if (!response.ok) {
    let detail = "";
    try {
      const body = JSON.parse(text);
      detail = typeof body.message === "string" ? body.message : typeof body.error === "string" ? body.error : "";
    } catch {
    }
    throw new HttpError(detail !== "" ? detail : `Skillhub \u8FD4\u56DE HTTP ${response.status}`, "HTTP_ERROR", response.status >= 500 ? 502 : response.status);
  }
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new HttpError("Skillhub \u8FD4\u56DE\u4E86\u65E0\u6548\u7684 JSON", "INVALID_JSON");
  }
  if (payload !== null && typeof payload === "object") {
    const code = payload.code;
    if (typeof code === "number" && code !== 0) {
      const message = payload.message;
      throw new HttpError(typeof message === "string" ? message : `Skillhub \u8FD4\u56DE\u9519\u8BEF\u7801 ${code}`, "SKILLHUB_CODE", 502);
    }
  }
  return payload;
}
async function fetchZip(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 12e4;
  const maxBytes = options.maxBytes ?? 32 * 1024 * 1024;
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/zip, application/octet-stream" },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const name2 = error instanceof Error ? error.name : "";
    if (name2 === "TimeoutError" || name2 === "AbortError") {
      throw new HttpError("\u4E0B\u8F7D\u6280\u80FD\u5305\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", "TIMEOUT", 504);
    }
    throw new HttpError(`\u4E0B\u8F7D\u6280\u80FD\u5305\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`, "NETWORK_ERROR");
  }
  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 300).trim();
    } catch {
    }
    throw new HttpError(detail !== "" ? detail : `\u4E0B\u8F7D\u6280\u80FD\u5305\u5931\u8D25\uFF1AHTTP ${response.status}`, "DOWNLOAD_HTTP", response.status === 404 ? 404 : 502);
  }
  const bytes = await readLimited(response, maxBytes);
  if (bytes.byteLength < 4 || bytes.readUInt32LE(0) !== 67324752) {
    throw new HttpError("\u4E0B\u8F7D\u5185\u5BB9\u4E0D\u662F\u6709\u6548\u7684 ZIP \u6587\u4EF6", "INVALID_ZIP");
  }
  return bytes;
}

// project/src/host/install.ts
import { mkdir as mkdir3, mkdtemp, rename as rename2, rm as rm2, stat as stat2 } from "node:fs/promises";
import { join as join2 } from "node:path";

// project/src/host/store.ts
import { readFile, readdir, rename, stat, writeFile, mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

// project/src/host/frontmatter.ts
function unquote(value) {
  const quote = value[0];
  const inner = value.slice(1, -1);
  if (quote === "'") return inner.replaceAll("''", "'");
  return inner.replaceAll("\\n", "\n").replaceAll("\\r", "\r").replaceAll("\\t", "	").replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}
function splitInlineList(value) {
  const out = [];
  let current = "";
  let quote = "";
  for (const character of value) {
    if (quote !== "") {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === ",") {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  out.push(current.trim());
  return out;
}
function parseYamlScalar(raw) {
  const value = raw.trim();
  if (value === "") return "";
  if (value.startsWith("[") && value.endsWith("]")) {
    return splitInlineList(value.slice(1, -1)).map((entry) => parseYamlScalar(entry)).filter((entry) => typeof entry === "string" || typeof entry === "number").map(String);
  }
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
    return unquote(value);
  }
  if (value === "true" || value === "TRUE") return true;
  if (value === "false" || value === "FALSE") return false;
  if (value === "null" || value === "~") return "";
  if (/^-?\d+$/.test(value)) {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : value;
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }
  return value;
}
function collectIndented(lines, start, parentIndent) {
  const collected = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") {
      collected.push("");
      index += 1;
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent <= parentIndent) break;
    collected.push(line.slice(Math.min(indent, parentIndent + 2)));
    index += 1;
  }
  while (collected.length > 0 && collected[collected.length - 1] === "") collected.pop();
  return { lines: collected, next: index };
}
function parseFrontmatterBlock(block) {
  const lines = block.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  const out = {};
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      index += 1;
      continue;
    }
    const indent = line.length - line.trimStart().length;
    const match = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (match === null) {
      index += 1;
      continue;
    }
    const key = match[1];
    const rest = match[2] ?? "";
    if (rest === "|" || rest === ">" || rest === "|-" || rest === ">-" || rest === "|+" || rest === ">+") {
      const folded = rest.startsWith(">");
      const collected = collectIndented(lines, index + 1, indent);
      out[key] = folded ? collected.lines.join(" ").trim() : collected.lines.join("\n");
      index = collected.next;
      continue;
    }
    if (rest === "") {
      const collected = collectIndented(lines, index + 1, indent);
      const listEntries = collected.lines.filter((entry) => entry.trimStart().startsWith("- "));
      if (listEntries.length > 0 && listEntries.length === collected.lines.filter((entry) => entry.trim() !== "").length) {
        out[key] = listEntries.map((entry) => String(parseYamlScalar(entry.trimStart().slice(2))));
      } else if (collected.lines.length > 0) {
        const nested = collected.lines.filter((entry) => entry.trim() !== "").map((entry) => entry.trim()).join("\n");
        const nestedMap = {};
        for (const nestedLine of nested.split("\n")) {
          const nestedMatch = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(nestedLine);
          if (nestedMatch !== null) nestedMap[nestedMatch[1]] = parseYamlScalar(nestedMatch[2] ?? "");
        }
        const keys = Object.keys(nestedMap);
        if (keys.length > 0) for (const nestedKey of keys) out[`${key}.${nestedKey}`] = nestedMap[nestedKey];
        else out[key] = nested;
      } else {
        out[key] = "";
      }
      index = collected.next;
      continue;
    }
    out[key] = parseYamlScalar(rest);
    index += 1;
  }
  return out;
}
function parseSkillMarkdown(text) {
  const normalized = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").replace(/^\uFEFF/, "");
  const lines = normalized.split("\n");
  if (lines.length === 0 || lines[0].trimEnd() !== "---") {
    return { frontmatter: {}, body: normalized, hasFrontmatter: false };
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === "---");
  if (end < 0) return { frontmatter: {}, body: normalized, hasFrontmatter: false };
  const block = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n").replace(/^\n/, "");
  return { frontmatter: parseFrontmatterBlock(block), body, hasFrontmatter: true };
}

// project/src/host/store.ts
function expandHome(value) {
  const trimmed = value.trim();
  if (trimmed === "~") return homedir();
  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) return resolve(homedir(), trimmed.slice(2));
  return resolve(trimmed);
}
function resolveDshHome(configured) {
  if (typeof configured === "string" && configured.trim() !== "") return expandHome(configured);
  const env = process.env.DSH_HOME;
  if (typeof env === "string" && env.trim() !== "") return expandHome(env);
  return join(homedir(), ".dsh");
}
function skillsRoot(dshHome) {
  return join(dshHome, "skills");
}
function customMetaPath(dshHome) {
  return join(dshHome, "skillhub-custom.json");
}
function assertSafeDirName(name2) {
  const trimmed = name2.trim();
  if (trimmed === "" || trimmed === "." || trimmed === "..") throw new Error("\u6280\u80FD\u76EE\u5F55\u540D\u65E0\u6548");
  if (trimmed.length > 128) throw new Error("\u6280\u80FD\u76EE\u5F55\u540D\u8FC7\u957F");
  if (/[\\/:*?"<>|\0]/.test(trimmed) || trimmed.includes("/")) throw new Error("\u6280\u80FD\u76EE\u5F55\u540D\u5305\u542B\u975E\u6CD5\u5B57\u7B26");
  if (trimmed.endsWith(".")) throw new Error("\u6280\u80FD\u76EE\u5F55\u540D\u4E0D\u80FD\u4EE5\u70B9\u7ED3\u5C3E");
  return trimmed;
}
function normalizeInstallSlug(slug) {
  const trimmed = slug.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(trimmed) || trimmed.endsWith(".")) {
    throw new Error("\u6280\u80FD slug \u4E0D\u5408\u6CD5\uFF0C\u65E0\u6CD5\u5B89\u88C5");
  }
  return trimmed;
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sanitizeMeta(slug, value) {
  if (!isRecord(value)) return void 0;
  const out = { slug };
  if (typeof value.displayName === "string") out.displayName = value.displayName;
  if (typeof value.note === "string") out.note = value.note;
  if (typeof value.downloadedAt === "string") out.downloadedAt = value.downloadedAt;
  if (typeof value.sourceHomepage === "string" && /^https?:\/\//i.test(value.sourceHomepage)) {
    out.sourceHomepage = value.sourceHomepage;
  }
  return out;
}
async function readCustomMeta(dshHome) {
  const path = customMetaPath(dshHome);
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { data: {} };
    return { data: {}, error: `\u8BFB\u53D6 skillhub-custom.json \u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { data: {}, error: `skillhub-custom.json \u4E0D\u662F\u6709\u6548 JSON\uFF1A${error instanceof Error ? error.message : String(error)}` };
  }
  if (!isRecord(parsed)) return { data: {}, error: "skillhub-custom.json \u7ED3\u6784\u65E0\u6548\uFF08\u5E94\u4E3A\u5BF9\u8C61\uFF09" };
  const data = {};
  for (const [slug, value] of Object.entries(parsed)) {
    const entry = sanitizeMeta(slug, value);
    if (entry !== void 0) data[slug] = entry;
  }
  return { data };
}
async function writeCustomMeta(dshHome, data) {
  const path = customMetaPath(dshHome);
  await mkdir(dshHome, { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temp, `${JSON.stringify(data, null, 2)}
`, "utf8");
    await rename(temp, path);
  } catch (error) {
    try {
      await rm(temp, { force: true });
    } catch {
    }
    throw new Error(`\u4FDD\u5B58 skillhub-custom.json \u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
  }
}
async function saveCustomEntry(dshHome, input) {
  const slug = assertSafeDirName(input.slug);
  const current = await readCustomMeta(dshHome);
  if (current.error !== void 0) throw new Error(`${current.error}\uFF1B\u8BF7\u5148\u4FEE\u590D\u8BE5\u6587\u4EF6\u518D\u4FDD\u5B58`);
  const previous = current.data[slug];
  const entry = {
    slug,
    ...previous?.downloadedAt === void 0 ? {} : { downloadedAt: previous.downloadedAt },
    ...previous?.sourceHomepage === void 0 ? {} : { sourceHomepage: previous.sourceHomepage }
  };
  const displayName = input.displayName.trim().slice(0, 120);
  const note = input.note.trim().slice(0, 2e3);
  if (displayName !== "") entry.displayName = displayName;
  if (note !== "") entry.note = note;
  const next = { ...current.data, [slug]: entry };
  await writeCustomMeta(dshHome, next);
  return entry;
}
async function recordInstallMeta(dshHome, slug, sourceHomepage) {
  const current = await readCustomMeta(dshHome);
  if (current.error !== void 0) return current.error;
  const previous = current.data[slug] ?? { slug };
  const next = {
    ...previous,
    slug,
    downloadedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (sourceHomepage !== void 0 && /^https?:\/\//i.test(sourceHomepage)) next.sourceHomepage = sourceHomepage;
  try {
    await writeCustomMeta(dshHome, { ...current.data, [slug]: next });
    return void 0;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
function frontmatterText(frontmatter, ...keys) {
  for (const key of keys) {
    const value = frontmatter[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string" && first.trim() !== "") return first.trim();
    }
  }
  return void 0;
}
function localGithubUrl(frontmatter, meta) {
  if (meta?.sourceHomepage !== void 0 && isGithubUrl(meta.sourceHomepage)) return meta.sourceHomepage;
  for (const key of ["homepage", "sourceUrl", "source_url", "repository", "githubUrl", "upstream_url"]) {
    const value = frontmatterText(frontmatter, key);
    if (value !== void 0 && isGithubUrl(value)) return value;
  }
  return void 0;
}
async function readInstalledSkill(dshHome, dirName, meta) {
  const path = join(skillsRoot(dshHome), dirName);
  const skillMd = join(path, "SKILL.md");
  const base = {
    slug: dirName,
    name: dirName,
    displayName: meta?.displayName?.trim() || dirName,
    note: meta?.note,
    description: "",
    path,
    frontmatter: {},
    body: ""
  };
  try {
    const info = await stat(skillMd);
    if (info.size > 2 * 1024 * 1024) throw new Error("SKILL.md \u8D85\u8FC7 2MB\uFF0C\u65E0\u6CD5\u663E\u793A");
    const text = await readFile(skillMd, "utf8");
    const parsed = parseSkillMarkdown(text);
    const frontmatter = parsed.frontmatter;
    const name2 = frontmatterText(frontmatter, "name") ?? dirName;
    const description = frontmatterText(frontmatter, "description", "description_zh") ?? "";
    const descriptionZh = frontmatterText(frontmatter, "description_zh");
    const requiresRaw = frontmatter["requires_api_key"] ?? frontmatter["labels.requires_api_key"];
    const requiresApiKey = typeof requiresRaw === "boolean" ? requiresRaw : typeof requiresRaw === "string" ? requiresRaw.toLowerCase() === "true" : void 0;
    const sourceHomepage = meta?.sourceHomepage ?? frontmatterText(frontmatter, "homepage", "sourceUrl", "source_url", "repository");
    return {
      ...base,
      name: name2,
      displayName: meta?.displayName?.trim() || name2 || dirName,
      description,
      descriptionZh,
      version: frontmatterText(frontmatter, "version"),
      category: frontmatterText(frontmatter, "category"),
      requiresApiKey,
      sourceHomepage,
      githubUrl: localGithubUrl(frontmatter, meta),
      updatedAt: info.mtime.toISOString(),
      frontmatter,
      body: parsed.body
    };
  } catch (error) {
    return {
      ...base,
      error: `\u8BFB\u53D6 ${dirName}/SKILL.md \u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`
    };
  }
}
async function scanInstalled(dshHome) {
  const root = skillsRoot(dshHome);
  const custom = await readCustomMeta(dshHome);
  const skills = [];
  let dirs = [];
  try {
    dirs = await readdir(root, { withFileTypes: true });
  } catch (error) {
    const code = error.code;
    if (code !== "ENOENT") {
      return { skills, dshHome, skillsRoot: root, metaError: `\u8BFB\u53D6\u6280\u80FD\u76EE\u5F55\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}` };
    }
  }
  for (const entry of dirs) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const meta = custom.data[entry.name];
    const skill = await readInstalledSkill(dshHome, entry.name, meta);
    if (skill.error === void 0 || skill.frontmatter !== void 0) {
      try {
        await stat(join(root, entry.name, "SKILL.md"));
        skills.push(skill);
      } catch {
      }
    }
  }
  skills.sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-Hans-CN"));
  return { skills, dshHome, skillsRoot: root, ...custom.error === void 0 ? {} : { metaError: custom.error } };
}
async function getInstalledDetail(dshHome, dirName) {
  const slug = assertSafeDirName(dirName);
  const root = skillsRoot(dshHome);
  const path = join(root, slug);
  if (!path.startsWith(resolve(root))) throw new Error("\u6280\u80FD\u76EE\u5F55\u8D8A\u754C");
  const custom = await readCustomMeta(dshHome);
  const skill = await readInstalledSkill(dshHome, slug, custom.data[slug]);
  if (skill.error !== void 0) throw new Error(skill.error);
  return skill;
}

// project/src/host/zip.ts
import { mkdir as mkdir2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname, resolve as resolve2, sep } from "node:path";
import { inflateRawSync } from "node:zlib";
var ZipError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "ZipError";
    this.code = code;
  }
};
var ZIP_LIMITS = {
  maxEntries: 500,
  maxEntryBytes: 16 * 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
  maxPathLength: 1024
};
var EOCD_SIGNATURE = 101010256;
var CENTRAL_SIGNATURE = 33639248;
var LOCAL_SIGNATURE = 67324752;
function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 65535 - 22);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== EOCD_SIGNATURE) continue;
    const commentLength = buffer.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === buffer.length) return offset;
  }
  throw new ZipError("INVALID_ZIP", "ZIP \u6587\u4EF6\u635F\u574F\uFF1A\u627E\u4E0D\u5230\u4E2D\u592E\u76EE\u5F55");
}
function assertSafeZipPath(rawName) {
  if (rawName === "" || rawName.length > ZIP_LIMITS.maxPathLength) {
    throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u8DEF\u5F84\u65E0\u6548\uFF1A${rawName.slice(0, 80)}`);
  }
  if (rawName.includes("\0")) throw new ZipError("UNSAFE_PATH", "ZIP \u5185\u8DEF\u5F84\u5305\u542B\u7A7A\u5B57\u7B26");
  const name2 = rawName.replaceAll("\\", "/");
  if (name2.startsWith("/")) throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u4E0D\u5141\u8BB8\u7EDD\u5BF9\u8DEF\u5F84\uFF1A${name2}`);
  if (/^[A-Za-z]:/.test(name2)) throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u4E0D\u5141\u8BB8\u76D8\u7B26\u8DEF\u5F84\uFF1A${name2}`);
  const segments = name2.split("/");
  for (const segment of segments) {
    if (segment === "..") throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u4E0D\u5141\u8BB8\u8DEF\u5F84\u7A7F\u8D8A\uFF1A${name2}`);
    if (segment === "") throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u4E0D\u5141\u8BB8\u7A7A\u8DEF\u5F84\u6BB5\uFF1A${name2}`);
  }
  return name2;
}
function readZipDirectory(buffer) {
  if (buffer.length < 22) throw new ZipError("INVALID_ZIP", "ZIP \u6587\u4EF6\u8FC7\u5C0F");
  const eocd = findEocd(buffer);
  const diskNumber = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const entriesOnDisk = buffer.readUInt16LE(eocd + 8);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new ZipError("ZIP64_UNSUPPORTED", "\u6682\u4E0D\u652F\u6301\u5206\u5377 ZIP");
  }
  if (entryCount === 65535 || centralSize === 4294967295 || centralOffset === 4294967295) {
    throw new ZipError("ZIP64_UNSUPPORTED", "\u6682\u4E0D\u652F\u6301 ZIP64 \u6280\u80FD\u5305");
  }
  if (entryCount > ZIP_LIMITS.maxEntries) {
    throw new ZipError("TOO_MANY_ENTRIES", `\u6280\u80FD\u5305\u6587\u4EF6\u8FC7\u591A\uFF08\u6700\u591A ${ZIP_LIMITS.maxEntries} \u4E2A\uFF09`);
  }
  if (centralOffset + centralSize > buffer.length) {
    throw new ZipError("INVALID_ZIP", "ZIP \u4E2D\u592E\u76EE\u5F55\u8D8A\u754C");
  }
  const entries = [];
  const names = /* @__PURE__ */ new Set();
  let totalBytes = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new ZipError("INVALID_ZIP", "ZIP \u4E2D\u592E\u76EE\u5F55\u9879\u635F\u574F");
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const crc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttrs = buffer.readUInt32LE(offset + 38);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > buffer.length) throw new ZipError("INVALID_ZIP", "ZIP \u4E2D\u592E\u76EE\u5F55\u9879\u8D8A\u754C");
    if ((flags & 1) !== 0) throw new ZipError("ENCRYPTED_ZIP", "\u6682\u4E0D\u652F\u6301\u52A0\u5BC6\u7684 ZIP");
    if (method !== 0 && method !== 8) {
      throw new ZipError("UNSUPPORTED_COMPRESSION", `\u4E0D\u652F\u6301\u7684 ZIP \u538B\u7F29\u65B9\u5F0F\uFF1A${method}`);
    }
    if (compressedSize > ZIP_LIMITS.maxEntryBytes || uncompressedSize > ZIP_LIMITS.maxEntryBytes) {
      throw new ZipError("ENTRY_TOO_LARGE", "ZIP \u5185\u5355\u4E2A\u6587\u4EF6\u8FC7\u5927");
    }
    totalBytes += uncompressedSize;
    if (totalBytes > ZIP_LIMITS.maxTotalBytes) throw new ZipError("ENTRY_TOO_LARGE", "ZIP \u89E3\u538B\u540E\u603B\u5927\u5C0F\u8FC7\u5927");
    const rawName = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    const isDirectory = rawName.endsWith("/") || rawName.endsWith("\\");
    const name2 = assertSafeZipPath(isDirectory ? rawName.slice(0, -1) : rawName) + (isDirectory ? "/" : "");
    const lookupName = isDirectory ? name2.slice(0, -1) : name2;
    if (lookupName !== "") {
      if (names.has(lookupName.toLowerCase())) {
        throw new ZipError("DUPLICATE_ENTRY", `ZIP \u5185\u5B58\u5728\u91CD\u590D\u8DEF\u5F84\uFF1A${lookupName}`);
      }
      names.add(lookupName.toLowerCase());
    }
    if ((externalAttrs >>> 16 & 61440) === 40960) {
      throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u4E0D\u5141\u8BB8\u7B26\u53F7\u94FE\u63A5\uFF1A${name2}`);
    }
    entries.push({ name: name2, method, flags, crc32: crc, compressedSize, uncompressedSize, localOffset, externalAttrs });
    offset = next;
  }
  return { entries, files: entries.filter((entry) => !entry.name.endsWith("/")) };
}
var CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) !== 0 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 4294967295;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 4294967295) >>> 0;
}
function readZipEntry(buffer, entry) {
  if (entry.localOffset + 30 > buffer.length) throw new ZipError("INVALID_ZIP", "ZIP \u672C\u5730\u6587\u4EF6\u5934\u8D8A\u754C");
  if (buffer.readUInt32LE(entry.localOffset) !== LOCAL_SIGNATURE) {
    throw new ZipError("INVALID_ZIP", "ZIP \u672C\u5730\u6587\u4EF6\u5934\u635F\u574F");
  }
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const end = start + entry.compressedSize;
  if (start < 0 || end > buffer.length) throw new ZipError("INVALID_ZIP", "ZIP \u6587\u4EF6\u6570\u636E\u8D8A\u754C");
  const compressed = buffer.subarray(start, end);
  let data;
  if (entry.method === 0) {
    data = Buffer.from(compressed);
  } else {
    try {
      data = inflateRawSync(compressed, { maxOutputLength: ZIP_LIMITS.maxEntryBytes });
    } catch {
      throw new ZipError("INVALID_ZIP", `\u65E0\u6CD5\u89E3\u538B ZIP \u5185\u7684\u6587\u4EF6\uFF1A${entry.name}`);
    }
  }
  if (data.length !== entry.uncompressedSize) {
    throw new ZipError("INVALID_ZIP", `ZIP \u5185\u6587\u4EF6\u5927\u5C0F\u4E0D\u4E00\u81F4\uFF1A${entry.name}`);
  }
  if (crc32(data) !== entry.crc32) {
    throw new ZipError("INVALID_CRC", `ZIP \u5185\u6587\u4EF6\u6821\u9A8C\u5931\u8D25\uFF1A${entry.name}`);
  }
  return data;
}
function findSkillRoot(files) {
  const names = files.map((entry) => entry.name);
  const rootIndex = names.findIndex((name2) => name2 === "SKILL.md");
  if (rootIndex >= 0) return { prefix: "", skillMdName: names[rootIndex] };
  const topLevel = new Set(files.map((entry) => entry.name.split("/")[0]));
  if (topLevel.size === 1) {
    const top = [...topLevel][0];
    const nested = names.find((name2) => name2 === `${top}/SKILL.md`);
    if (nested !== void 0) return { prefix: `${top}/`, skillMdName: nested };
  }
  throw new ZipError("MISSING_SKILL_MD", "\u6280\u80FD\u5305\u6839\u76EE\u5F55\u7F3A\u5C11 SKILL.md\uFF0C\u5DF2\u5224\u5B9A\u4E3A\u65E0\u6548\u6280\u80FD");
}
async function extractZip(buffer, destDir) {
  const archive = readZipDirectory(buffer);
  const layout = findSkillRoot(archive.files);
  const root = resolve2(destDir);
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
  let files = 0;
  for (const entry of archive.files) {
    if (layout.prefix !== "" && !entry.name.startsWith(layout.prefix)) continue;
    const relative = layout.prefix === "" ? entry.name : entry.name.slice(layout.prefix.length);
    if (relative === "") continue;
    const safeRelative = assertSafeZipPath(relative);
    const target = resolve2(root, ...safeRelative.split("/"));
    if (target !== root && !target.startsWith(rootPrefix)) {
      throw new ZipError("UNSAFE_PATH", `ZIP \u5185\u8DEF\u5F84\u8D8A\u754C\uFF1A${entry.name}`);
    }
    const data = readZipEntry(buffer, entry);
    try {
      await mkdir2(dirname(target), { recursive: true });
      await writeFile2(target, data);
    } catch (error) {
      throw new ZipError("EXTRACT_FAILED", `\u5199\u5165\u6280\u80FD\u6587\u4EF6\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
    }
    files += 1;
  }
  if (files === 0) throw new ZipError("MISSING_SKILL_MD", "\u6280\u80FD\u5305\u4E3A\u7A7A");
  const skillMdPath = resolve2(root, "SKILL.md");
  if (!skillMdPath.startsWith(rootPrefix)) throw new ZipError("UNSAFE_PATH", "SKILL.md \u8DEF\u5F84\u8D8A\u754C");
  return { files, skillMdPath };
}

// project/src/host/install.ts
var InstallError = class extends Error {
  code;
  status;
  constructor(message, code, status = 400) {
    super(message);
    this.name = "InstallError";
    this.code = code;
    this.status = status;
  }
};
async function exists(path) {
  try {
    await stat2(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
async function installSkill(options) {
  const slug = normalizeInstallSlug(options.slug);
  const root = skillsRoot(options.dshHome);
  await mkdir3(root, { recursive: true });
  const target = join2(root, slug);
  const existed = await exists(target);
  if (existed && !options.overwrite) {
    throw new InstallError(`\u6280\u80FD\u300C${slug}\u300D\u5DF2\u5B58\u5728`, "ALREADY_EXISTS", 409);
  }
  const zip = await fetchZip(downloadUrl(slug));
  let temp;
  let fileCount = 0;
  let backup;
  let movedOld = false;
  let installed = false;
  try {
    temp = await mkdtemp(join2(root, ".skillhub-tmp-"));
    const extracted = await extractZip(zip, temp);
    fileCount = extracted.files;
    const skillMd = await stat2(extracted.skillMdPath);
    if (!skillMd.isFile()) throw new InstallError("\u6280\u80FD\u5305\u7F3A\u5C11 SKILL.md\uFF0C\u5DF2\u5224\u5B9A\u4E3A\u65E0\u6548\u6280\u80FD", "MISSING_SKILL_MD");
    if (existed) {
      backup = join2(root, `.skillhub-backup-${slug}-${Date.now()}`);
      await rename2(target, backup);
      movedOld = true;
    }
    try {
      await rename2(temp, target);
      temp = void 0;
      installed = true;
    } catch (error) {
      throw new InstallError(
        `\u5199\u5165\u6280\u80FD\u76EE\u5F55\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`,
        "INSTALL_FAILED",
        error.code === "EPERM" ? 403 : 500
      );
    }
  } catch (error) {
    if (movedOld && backup !== void 0 && !installed) {
      try {
        await rename2(backup, target);
        backup = void 0;
      } catch {
      }
    }
    throw error;
  } finally {
    if (temp !== void 0) {
      try {
        await rm2(temp, { recursive: true, force: true });
      } catch {
      }
    }
  }
  if (backup !== void 0) {
    try {
      await rm2(backup, { recursive: true, force: true });
    } catch {
    }
  }
  const metaWarning = await recordInstallMeta(options.dshHome, slug, options.sourceHomepage);
  return {
    slug,
    path: target,
    files: fileCount,
    overwritten: existed,
    ...metaWarning === void 0 ? {} : { metaWarning }
  };
}

// project/src/host/skillhub.ts
async function listSkills(query) {
  const payload = await fetchJson(listUrl(query));
  return normalizeListPayload(payload);
}
async function getCategories() {
  const payload = await fetchJson(`${SKILLHUB_API}${CATEGORIES_PATH}`, { timeoutMs: 1e4 });
  return normalizeCategories(payload);
}
async function getSkillDetail(slug, namespace) {
  if (slug.trim() === "") throw new HttpError("\u7F3A\u5C11\u6280\u80FD slug", "INVALID_ARGUMENT", 400);
  const payload = await fetchJson(detailUrl(slug, namespace));
  return normalizeDetailPayload(payload);
}

// project/src/host/routes.ts
var API_PREFIX = "/api/skillhub-market";
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
function errorResponse(error) {
  if (error instanceof InstallError) return json({ error: error.message, code: error.code }, error.status);
  if (error instanceof ZipError) return json({ error: error.message, code: error.code }, 400);
  if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status);
  return json({ error: error instanceof Error ? error.message : String(error), code: "INTERNAL_ERROR" }, 500);
}
async function readJsonBody(request, limit = 64 * 1024) {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > limit) throw new HttpError("\u8BF7\u6C42\u4F53\u8FC7\u5927", "BODY_TOO_LARGE", 413);
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > limit) throw new HttpError("\u8BF7\u6C42\u4F53\u8FC7\u5927", "BODY_TOO_LARGE", 413);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError("\u8BF7\u6C42\u4F53\u4E0D\u662F\u6709\u6548 JSON", "INVALID_BODY", 400);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError("\u8BF7\u6C42\u4F53\u5E94\u4E3A\u5BF9\u8C61", "INVALID_BODY", 400);
  }
  return parsed;
}
function stringField(body, key) {
  const value = body[key];
  return typeof value === "string" ? value : void 0;
}
function parseSkillQuery(params) {
  const sort = params.get("sort");
  const source = params.get("source");
  const apiKey = params.get("apiKey");
  const allowedSorts = ["all", "trending", "downloads", "newest"];
  const allowedSources = ["all", "community", "clawhub", "enterprise"];
  const allowedApiKeys = ["all", "required", "none"];
  return {
    keyword: params.get("keyword") ?? "",
    page: Number(params.get("page") ?? "1"),
    pageSize: Number(params.get("pageSize") ?? "24"),
    sort: allowedSorts.includes(sort) ? sort : "all",
    source: allowedSources.includes(source) ? source : "all",
    category: params.get("category") ?? "all",
    apiKey: allowedApiKeys.includes(apiKey) ? apiKey : "all"
  };
}
function openDirectory(path) {
  const command = process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  return new Promise((resolve3, reject) => {
    let settled = false;
    const child = spawn(command, [path], { detached: true, stdio: "ignore" });
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    child.once("spawn", () => {
      if (settled) return;
      settled = true;
      child.unref();
      resolve3();
    });
  });
}
function createRoutes(resolveHome) {
  return [
    {
      path: `${API_PREFIX}/skills`,
      methods: ["GET"],
      fetch: async (request) => {
        try {
          const url = new URL(request.url, "http://localhost");
          return json(await listSkills(parseSkillQuery(url.searchParams)));
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/categories`,
      methods: ["GET"],
      fetch: async () => {
        try {
          return json({ items: await getCategories() });
        } catch {
          return json({ items: FALLBACK_CATEGORIES, fallback: true });
        }
      }
    },
    {
      path: `${API_PREFIX}/detail`,
      methods: ["GET"],
      fetch: async (request) => {
        try {
          const url = new URL(request.url, "http://localhost");
          const slug = url.searchParams.get("slug") ?? "";
          const namespace = url.searchParams.get("namespace") ?? void 0;
          return json(await getSkillDetail(slug, namespace));
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/install`,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        try {
          const body = await readJsonBody(request);
          const slug = stringField(body, "slug") ?? "";
          if (slug.trim() === "") throw new HttpError("\u7F3A\u5C11\u6280\u80FD slug", "INVALID_ARGUMENT", 400);
          const homepage = stringField(body, "sourceHomepage");
          const result = await installSkill({
            dshHome: resolveHome(),
            slug,
            overwrite: body.overwrite === true,
            ...homepage === void 0 ? {} : { sourceHomepage: homepage }
          });
          return json(result);
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/installed`,
      methods: ["GET"],
      fetch: async () => {
        try {
          return json(await scanInstalled(resolveHome()));
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/installed/detail`,
      methods: ["GET"],
      fetch: async (request) => {
        try {
          const url = new URL(request.url, "http://localhost");
          const dir = url.searchParams.get("dir") ?? "";
          return json(await getInstalledDetail(resolveHome(), dir));
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/custom`,
      methods: ["GET"],
      fetch: async () => {
        try {
          const result = await readCustomMeta(resolveHome());
          return json(result);
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/custom`,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        try {
          const body = await readJsonBody(request);
          const slug = stringField(body, "slug") ?? "";
          const displayName = stringField(body, "displayName") ?? "";
          const note = stringField(body, "note") ?? "";
          const safe = assertSafeDirName(slug);
          const home = resolveHome();
          const skillPath = join3(skillsRoot(home), safe, "SKILL.md");
          try {
            const info = await stat3(skillPath);
            if (!info.isFile()) throw new Error("not a file");
          } catch {
            throw new HttpError("\u6280\u80FD\u4E0D\u5B58\u5728\u6216\u7F3A\u5C11 SKILL.md", "NOT_FOUND", 404);
          }
          return json(await saveCustomEntry(home, { slug: safe, displayName, note }));
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/open-folder`,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        try {
          const body = await readJsonBody(request);
          const slug = stringField(body, "dir") ?? "";
          const skill = await getInstalledDetail(resolveHome(), slug);
          await openDirectory(skill.path);
          return json({ ok: true, path: skill.path });
        } catch (error) {
          return errorResponse(error);
        }
      }
    },
    {
      path: `${API_PREFIX}/health`,
      methods: ["GET"],
      fetch: async () => json({ ok: true, dshHome: resolveHome() })
    }
  ];
}

// project/src/index.ts
var name = "dsh-skillhub-market";
var inject = ["connection"];
function apply(ctx, config) {
  const routes = createRoutes(() => resolveDshHome(config?.dshHome));
  const install = () => {
    const connection = ctx.connection;
    const register = connection?.fetch?.register;
    if (typeof register !== "function" || connection?.fetch === void 0) {
      ctx.logger?.warn?.("skillhub-market: \u5F53\u524D\u5BBF\u4E3B\u672A\u63D0\u4F9B connection.fetch\uFF0C\u5E02\u573A API \u4E0D\u53EF\u7528");
      return () => {
      };
    }
    const disposers = routes.map((route) => {
      try {
        return register.call(connection.fetch, {
          path: route.path,
          methods: route.methods,
          requestBody: route.requestBody ?? "buffered",
          fetch: route.fetch
        });
      } catch (error) {
        ctx.logger?.warn?.(`skillhub-market: \u6CE8\u518C\u8DEF\u7531 ${route.path} \u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
        return () => {
        };
      }
    });
    return () => {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
        }
      }
    };
  };
  if (typeof ctx.effect === "function") ctx.effect(install, "skillhub-market: API routes");
  else install();
}
export {
  apply,
  inject,
  name
};
