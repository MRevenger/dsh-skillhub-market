window.__ModuleLoader__.load({
  id: '@local/dsh-skillhub-market',
  factory: function (require) {
var __skillhubMarket = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // project/src/client/index.tsx
  var client_exports = {};
  __export(client_exports, {
    apply: () => apply,
    inject: () => inject
  });
  var import_react6 = __toESM(__require("react"));

  // project/src/client/api.ts
  var ApiError = class extends Error {
    constructor(message, code, status = 0) {
      super(message);
      __publicField(this, "code");
      __publicField(this, "status");
      this.name = "ApiError";
      this.code = code;
      this.status = status;
    }
  };
  var BASE = "api/skillhub-market";
  async function readError(response) {
    let message = `HTTP ${response.status}`;
    let code = "HTTP_ERROR";
    try {
      const payload = await response.json();
      if (typeof payload.error === "string" && payload.error !== "") message = payload.error;
      else if (typeof payload.message === "string" && payload.message !== "") message = payload.message;
      if (typeof payload.code === "string") code = payload.code;
    } catch {
    }
    return new ApiError(message, code, response.status);
  }
  async function request(path, options = {}) {
    const timeoutMs = options.timeoutMs ?? 2e4;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const forwardAbort = () => controller.abort();
    options.signal?.addEventListener("abort", forwardAbort);
    try {
      const response = await fetch(path, {
        method: options.method ?? "GET",
        headers: options.body === void 0 ? void 0 : { "content-type": "application/json" },
        body: options.body === void 0 ? void 0 : JSON.stringify(options.body),
        signal: controller.signal,
        credentials: "same-origin"
      });
      if (!response.ok) throw await readError(response);
      const text = await response.text();
      if (text.trim() === "") return void 0;
      try {
        return JSON.parse(text);
      } catch {
        throw new ApiError("\u670D\u52A1\u8FD4\u56DE\u4E86\u65E0\u6548\u7684 JSON", "INVALID_RESPONSE", response.status);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted) {
        throw new ApiError(options.signal?.aborted === true ? "\u8BF7\u6C42\u5DF2\u53D6\u6D88" : "\u8BF7\u6C42\u8D85\u65F6", "TIMEOUT", 0);
      }
      throw new ApiError(error instanceof Error ? error.message : String(error), "NETWORK_ERROR", 0);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", forwardAbort);
    }
  }
  var SkillhubApi = class {
    /** Fetch one page of the market feed. */
    list(query, signal) {
      const params = new URLSearchParams({
        keyword: query.keyword,
        page: String(query.page),
        pageSize: String(query.pageSize),
        sort: query.sort,
        source: query.source,
        category: query.category,
        apiKey: query.apiKey
      });
      return request(`${BASE}/skills?${params.toString()}`, { signal });
    }
    /** Fetch categories (the host falls back to a bundled list if needed). */
    categories(signal) {
      return request(`${BASE}/categories`, { signal });
    }
    /** Fetch one skill's online detail. */
    detail(slug, namespace, signal) {
      const params = new URLSearchParams({ slug });
      if (namespace !== void 0 && namespace !== "") params.set("namespace", namespace);
      return request(`${BASE}/detail?${params.toString()}`, { signal });
    }
    /** Download and install a skill. */
    install(slug, overwrite, sourceHomepage) {
      return request(`${BASE}/install`, {
        method: "POST",
        body: {
          slug,
          overwrite,
          ...sourceHomepage === void 0 ? {} : { sourceHomepage }
        },
        timeoutMs: 18e4
      });
    }
    /** Scan local skills. */
    installed(signal) {
      return request(`${BASE}/installed`, { signal });
    }
    /** Read one local skill including its Markdown body. */
    installedDetail(dir, signal) {
      return request(`${BASE}/installed/detail?dir=${encodeURIComponent(dir)}`, { signal });
    }
    /** Read user metadata. */
    custom(signal) {
      return request(`${BASE}/custom`, { signal });
    }
    /** Save a custom display name and note (never writes SKILL.md). */
    saveCustom(slug, displayName, note) {
      return request(`${BASE}/custom`, {
        method: "POST",
        body: { slug, displayName, note }
      });
    }
    /** Ask the host to reveal the installed folder in the OS file manager. */
    openFolder(dir) {
      return request(`${BASE}/open-folder`, {
        method: "POST",
        body: { dir }
      });
    }
  };

  // project/src/client/locale.ts
  var zh = {
    "entry.label": "\u6280\u80FD\u5E02\u573A",
    "title": "Skillhub \u6280\u80FD\u5E02\u573A",
    "subtitle": "\u6D4F\u89C8\u3001\u641C\u7D22\u5E76\u5B89\u88C5 Skillhub \u4E0A\u7684\u6280\u80FD",
    "tab.market": "\u5728\u7EBF\u5E02\u573A",
    "tab.downloaded": "\u5DF2\u4E0B\u8F7D",
    "search.placeholder": "\u641C\u7D22\u6280\u80FD\u540D\u79F0\u3001\u7B80\u4ECB\u6216\u6807\u7B7E\u2026",
    "search.clear": "\u6E05\u7A7A\u641C\u7D22",
    "sort.label": "\u6392\u5E8F",
    "sort.all": "\u5168\u90E8",
    "sort.trending": "\u8FD1\u671F\u98D9\u5347",
    "sort.downloads": "\u4E0B\u8F7D\u91CF",
    "sort.newest": "\u6700\u8FD1\u4E0A\u65B0",
    "sort.trendingHint": "Skillhub \u672A\u63D0\u4F9B trending \u6392\u5E8F\uFF0C\u8FD9\u91CC\u4F7F\u7528\u7EFC\u5408\u70ED\u5EA6 score \u5012\u5E8F",
    "filter.source": "\u6765\u6E90",
    "filter.category": "\u573A\u666F\u5206\u7C7B",
    "filter.apiKey": "API Key",
    "filter.all": "\u5168\u90E8",
    "filter.reset": "\u91CD\u7F6E\u7B5B\u9009",
    "source.community": "\u793E\u533A",
    "source.clawhub": "ClawHub",
    "source.enterprise": "\u4F01\u4E1A",
    "apiKey.required": "\u9700\u8981 API Key",
    "apiKey.none": "\u4E0D\u9700\u8981 API Key",
    "stat.downloads": "\u4E0B\u8F7D",
    "stat.stars": "Star",
    "stat.updated": "\u66F4\u65B0",
    "stat.apiKey": "API Key",
    "card.view": "\u67E5\u770B\u8BE6\u60C5",
    "card.github": "\u8DF3\u8F6C GitHub",
    "card.skillhub": "Skillhub \u8BE6\u60C5",
    "card.download": "\u4E0B\u8F7D",
    "card.downloading": "\u4E0B\u8F7D\u4E2D\u2026",
    "card.installed": "\u5DF2\u4E0B\u8F7D",
    "card.redownload": "\u91CD\u65B0\u4E0B\u8F7D",
    "card.apiKeyRequired": "\u9700\u8981 API Key",
    "card.apiKeyNone": "\u65E0\u9700 API Key",
    "list.loading": "\u6B63\u5728\u52A0\u8F7D\u6280\u80FD\u2026",
    "list.empty": "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u6280\u80FD",
    "list.emptyHint": "\u8BD5\u8BD5\u66F4\u6362\u5173\u952E\u8BCD\u6216\u91CD\u7F6E\u7B5B\u9009\u6761\u4EF6",
    "list.error": "\u6280\u80FD\u5217\u8868\u52A0\u8F7D\u5931\u8D25",
    "list.retry": "\u91CD\u8BD5",
    "list.total": "\u5171 {total} \u4E2A\u6280\u80FD",
    "list.page": "\u7B2C {page} / {pages} \u9875",
    "list.prev": "\u4E0A\u4E00\u9875",
    "list.next": "\u4E0B\u4E00\u9875",
    "list.pageSize": "\u6BCF\u9875 {size} \u4E2A",
    "detail.title": "\u6280\u80FD\u8BE6\u60C5",
    "detail.loading": "\u6B63\u5728\u52A0\u8F7D\u8BE6\u60C5\u2026",
    "detail.error": "\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4E3A\u5217\u8868\u4E2D\u7684\u4FE1\u606F",
    "detail.overview": "\u7B80\u4ECB",
    "detail.meta": "\u5143\u4FE1\u606F",
    "detail.version": "\u7248\u672C",
    "detail.category": "\u5206\u7C7B",
    "detail.source": "\u6765\u6E90",
    "detail.published": "\u53D1\u5E03\u65F6\u95F4",
    "detail.updated": "\u66F4\u65B0\u65F6\u95F4",
    "detail.downloads": "\u4E0B\u8F7D\u91CF",
    "detail.stars": "Star \u6570",
    "detail.installs": "\u5B89\u88C5\u91CF",
    "detail.requiresApiKey": "\u662F\u5426\u9700\u8981 API Key",
    "detail.yes": "\u662F",
    "detail.no": "\u5426",
    "detail.tags": "\u6807\u7B7E",
    "detail.homepage": "\u4E3B\u9875",
    "detail.github": "\u6253\u5F00 GitHub \u4ED3\u5E93",
    "detail.skillhub": "\u6253\u5F00 Skillhub \u9875\u9762",
    "detail.install": "\u4E0B\u8F7D\u5E76\u5B89\u88C5",
    "detail.installing": "\u6B63\u5728\u5B89\u88C5\u2026",
    "overwrite.title": "\u6280\u80FD\u5DF2\u5B58\u5728",
    "overwrite.body": "\u6280\u80FD\u300C{name}\u300D\u5DF2\u7ECF\u5B89\u88C5\u5728 {path}\u3002\u662F\u5426\u8986\u76D6\u73B0\u6709\u6587\u4EF6\uFF1F\u4F60\u81EA\u5B9A\u4E49\u7684\u663E\u793A\u540D\u548C\u5907\u6CE8\u4F1A\u4FDD\u7559\u3002",
    "overwrite.confirm": "\u8986\u76D6\u5B89\u88C5",
    "overwrite.cancel": "\u53D6\u6D88",
    "toast.installMetaWarning": "\u6280\u80FD\u5DF2\u5B89\u88C5\uFF0C\u4F46\u5143\u6570\u636E\u5199\u5165\u5931\u8D25\uFF1A{message}",
    "toast.installSuccess": "\u6280\u80FD\u300C{name}\u300D\u5B89\u88C5\u6210\u529F",
    "toast.installFailed": "\u5B89\u88C5\u5931\u8D25\uFF1A{message}",
    "toast.saved": "\u5DF2\u4FDD\u5B58\u81EA\u5B9A\u4E49\u540D\u79F0\u548C\u5907\u6CE8",
    "toast.saveFailed": "\u4FDD\u5B58\u5931\u8D25\uFF1A{message}",
    "toast.openFailed": "\u65E0\u6CD5\u6253\u5F00\u76EE\u5F55\uFF1A{message}",
    "toast.refreshed": "\u5DF2\u5237\u65B0\u5DF2\u4E0B\u8F7D\u6280\u80FD",
    "toast.detailFailed": "\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25\uFF1A{message}",
    "downloaded.title": "\u5DF2\u4E0B\u8F7D\u6280\u80FD",
    "downloaded.subtitle": "\u626B\u63CF DSH \u6280\u80FD\u76EE\u5F55\uFF0C\u67E5\u770B\u548C\u7BA1\u7406\u672C\u5730\u6280\u80FD",
    "downloaded.root": "\u6280\u80FD\u76EE\u5F55",
    "downloaded.refresh": "\u5237\u65B0",
    "downloaded.loading": "\u6B63\u5728\u626B\u63CF\u672C\u5730\u6280\u80FD\u2026",
    "downloaded.empty": "\u8FD8\u6CA1\u6709\u4E0B\u8F7D\u4EFB\u4F55\u6280\u80FD",
    "downloaded.emptyHint": "\u524D\u5F80\u5728\u7EBF\u5E02\u573A\uFF0C\u4E0B\u8F7D\u7B2C\u4E00\u4E2A\u6280\u80FD",
    "downloaded.error": "\u8BFB\u53D6\u672C\u5730\u6280\u80FD\u5931\u8D25",
    "downloaded.count": "\u5171 {count} \u4E2A\u6280\u80FD",
    "downloaded.openFolder": "\u6253\u5F00\u672C\u5730\u76EE\u5F55",
    "downloaded.viewDetail": "\u67E5\u770B\u5185\u5BB9",
    "downloaded.detailError": "\u8BFB\u53D6\u6280\u80FD\u5185\u5BB9\u5931\u8D25",
    "downloaded.originalName": "\u539F\u59CB\u540D\u79F0",
    "downloaded.slug": "Slug / \u76EE\u5F55",
    "downloaded.dir": "\u76EE\u5F55",
    "downloaded.displayName": "\u81EA\u5B9A\u4E49\u663E\u793A\u540D",
    "downloaded.displayNamePlaceholder": "\u7559\u7A7A\u5219\u4F7F\u7528\u6280\u80FD\u539F\u540D",
    "downloaded.note": "\u5907\u6CE8",
    "downloaded.notePlaceholder": "\u4F8B\u5982\uFF1A\u6BCF\u5468\u62A5\u8868\u5904\u7406\u4E13\u7528",
    "downloaded.save": "\u4FDD\u5B58",
    "downloaded.saving": "\u4FDD\u5B58\u4E2D\u2026",
    "downloaded.frontmatter": "Frontmatter \u5143\u4FE1\u606F",
    "downloaded.body": "SKILL.md \u5185\u5BB9",
    "downloaded.noBody": "SKILL.md \u6CA1\u6709\u6B63\u6587\u5185\u5BB9",
    "downloaded.description": "\u7B80\u4ECB",
    "downloaded.version": "\u7248\u672C",
    "downloaded.metaError": "\u7528\u6237\u5143\u6570\u636E\u6587\u4EF6\u635F\u574F\uFF0C\u5DF2\u5FFD\u7565\u81EA\u5B9A\u4E49\u540D\u79F0\u548C\u5907\u6CE8\uFF1A{message}",
    "downloaded.reinstallHint": "\u91CD\u65B0\u5B89\u88C5\u540C\u4E00 slug \u65F6\u4F1A\u4FDD\u7559\u8FD9\u91CC\u7684\u663E\u793A\u540D\u548C\u5907\u6CE8\u3002",
    "downloaded.noGithub": "\u672A\u63D0\u4F9B GitHub \u4ED3\u5E93",
    "downloaded.openGithub": "\u6253\u5F00 GitHub",
    "downloaded.customNameHint": "\u53EA\u4FDD\u5B58\u5728 skillhub-custom.json\uFF0C\u4E0D\u4F1A\u4FEE\u6539 SKILL.md\u3002",
    "common.cancel": "\u53D6\u6D88",
    "common.confirm": "\u786E\u5B9A",
    "common.retry": "\u91CD\u8BD5",
    "common.close": "\u5173\u95ED",
    "common.loading": "\u52A0\u8F7D\u4E2D\u2026",
    "common.unknown": "\u672A\u77E5",
    "error.network": "\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
    "error.timeout": "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5",
    "error.http": "\u8BF7\u6C42\u5931\u8D25\uFF08HTTP {status}\uFF09",
    "footer.sourceApi": "\u6570\u636E\u6765\u81EA api.skillhub.cn"
  };
  var en = {
    "entry.label": "Skill Market",
    "title": "Skillhub Market",
    "subtitle": "Browse, search and install skills from Skillhub",
    "tab.market": "Market",
    "tab.downloaded": "Downloaded",
    "search.placeholder": "Search skill name, description or tags\u2026",
    "search.clear": "Clear search",
    "sort.label": "Sort",
    "sort.all": "All",
    "sort.trending": "Trending",
    "sort.downloads": "Downloads",
    "sort.newest": "Newest",
    "sort.trendingHint": "Skillhub has no trend sort; score descending is used instead",
    "filter.source": "Source",
    "filter.category": "Category",
    "filter.apiKey": "API Key",
    "filter.all": "All",
    "filter.reset": "Reset filters",
    "source.community": "Community",
    "source.clawhub": "ClawHub",
    "source.enterprise": "Enterprise",
    "apiKey.required": "API key required",
    "apiKey.none": "No API key",
    "stat.downloads": "Downloads",
    "stat.stars": "Stars",
    "stat.updated": "Updated",
    "stat.apiKey": "API key",
    "card.view": "Details",
    "card.github": "GitHub",
    "card.skillhub": "Skillhub page",
    "card.download": "Download",
    "card.downloading": "Downloading\u2026",
    "card.installed": "Installed",
    "card.redownload": "Reinstall",
    "card.apiKeyRequired": "API key required",
    "card.apiKeyNone": "No API key",
    "list.loading": "Loading skills\u2026",
    "list.empty": "No matching skills",
    "list.emptyHint": "Try another keyword or reset the filters",
    "list.error": "Could not load skills",
    "list.retry": "Retry",
    "list.total": "{total} skills",
    "list.page": "Page {page} of {pages}",
    "list.prev": "Previous",
    "list.next": "Next",
    "list.pageSize": "{size} per page",
    "detail.title": "Skill details",
    "detail.loading": "Loading details\u2026",
    "detail.error": "Could not load details; showing list information",
    "detail.overview": "Overview",
    "detail.meta": "Metadata",
    "detail.version": "Version",
    "detail.category": "Category",
    "detail.source": "Source",
    "detail.published": "Published",
    "detail.updated": "Updated",
    "detail.downloads": "Downloads",
    "detail.stars": "Stars",
    "detail.installs": "Installs",
    "detail.requiresApiKey": "Requires API key",
    "detail.yes": "Yes",
    "detail.no": "No",
    "detail.tags": "Tags",
    "detail.homepage": "Homepage",
    "detail.github": "Open GitHub repository",
    "detail.skillhub": "Open Skillhub page",
    "detail.install": "Download and install",
    "detail.installing": "Installing\u2026",
    "overwrite.title": "Skill already exists",
    "overwrite.body": "\u201C{name}\u201D is already installed at {path}. Overwrite the existing files? Your custom display name and note are kept.",
    "overwrite.confirm": "Overwrite",
    "overwrite.cancel": "Cancel",
    "toast.installMetaWarning": "Skill installed, but metadata could not be saved: {message}",
    "toast.installSuccess": "Installed \u201C{name}\u201D",
    "toast.installFailed": "Install failed: {message}",
    "toast.saved": "Custom name and note saved",
    "toast.saveFailed": "Save failed: {message}",
    "toast.openFailed": "Could not open folder: {message}",
    "toast.refreshed": "Downloaded skills refreshed",
    "toast.detailFailed": "Could not load details: {message}",
    "downloaded.title": "Downloaded skills",
    "downloaded.subtitle": "Scan the DSH skills directory and manage local skills",
    "downloaded.root": "Skills folder",
    "downloaded.refresh": "Refresh",
    "downloaded.loading": "Scanning local skills\u2026",
    "downloaded.empty": "No skills downloaded yet",
    "downloaded.emptyHint": "Open the market and install your first skill",
    "downloaded.error": "Could not read local skills",
    "downloaded.count": "{count} skills",
    "downloaded.openFolder": "Open folder",
    "downloaded.viewDetail": "View content",
    "downloaded.detailError": "Could not read skill content",
    "downloaded.originalName": "Original name",
    "downloaded.slug": "Slug / folder",
    "downloaded.dir": "Folder",
    "downloaded.displayName": "Custom display name",
    "downloaded.displayNamePlaceholder": "Leave empty to use the original name",
    "downloaded.note": "Note",
    "downloaded.notePlaceholder": "e.g. weekly report processing",
    "downloaded.save": "Save",
    "downloaded.saving": "Saving\u2026",
    "downloaded.frontmatter": "Frontmatter metadata",
    "downloaded.body": "SKILL.md content",
    "downloaded.noBody": "SKILL.md has no body content",
    "downloaded.description": "Description",
    "downloaded.version": "Version",
    "downloaded.metaError": "The user metadata file is invalid; custom names and notes were ignored: {message}",
    "downloaded.reinstallHint": "Reinstalling the same slug keeps this display name and note.",
    "downloaded.noGithub": "No GitHub repository provided",
    "downloaded.openGithub": "Open GitHub",
    "downloaded.customNameHint": "Stored only in skillhub-custom.json; SKILL.md is never modified.",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.retry": "Retry",
    "common.close": "Close",
    "common.loading": "Loading\u2026",
    "common.unknown": "Unknown",
    "error.network": "Network request failed. Check your connection and retry.",
    "error.timeout": "Request timed out. Please retry.",
    "error.http": "Request failed (HTTP {status})",
    "footer.sourceApi": "Data from api.skillhub.cn"
  };
  function interpolate(template, params) {
    if (params === void 0) return template;
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = params[key];
      return value === void 0 ? match : String(value);
    });
  }
  function makeTranslator(raw) {
    return (key, params) => {
      let value = "";
      try {
        value = raw(key);
      } catch {
        value = "";
      }
      if (value === "" || value === key) value = zh[key];
      return interpolate(value, params);
    };
  }

  // project/src/client/page.tsx
  var import_react5 = __toESM(__require("react"));

  // project/src/client/downloaded.tsx
  var import_react3 = __toESM(__require("react"));

  // project/src/client/format.ts
  function formatCount(value) {
    if (value === void 0 || !Number.isFinite(value)) return "\u2014";
    try {
      return new Intl.NumberFormat(void 0, { notation: "compact", maximumFractionDigits: 1 }).format(value);
    } catch {
      return String(value);
    }
  }
  function formatDate(value) {
    if (value === void 0) return "\u2014";
    const time = typeof value === "string" ? Date.parse(value) : value;
    if (!Number.isFinite(time) || time <= 0) return "\u2014";
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return "\u2014";
    try {
      return date.toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }
  function initials(name) {
    const trimmed = name.trim();
    return trimmed === "" ? "?" : Array.from(trimmed)[0]?.toUpperCase() ?? "?";
  }
  function sourceLabel(source, t) {
    if (source === void 0 || source === "") return t("common.unknown");
    if (source === "community" || source === "clawhub" || source === "enterprise") {
      return t(`source.${source}`);
    }
    return source;
  }
  function errorText(error, t) {
    if (error !== null && typeof error === "object") {
      const code = error.code;
      if (code === "TIMEOUT") return t("error.timeout");
      if (code === "NETWORK_ERROR") return t("error.network");
      if (code === "INVALID_RESPONSE") return t("error.network");
      const message = error.message;
      if (typeof message === "string" && message !== "") return message;
    }
    if (error instanceof Error && error.message !== "") return error.message;
    return String(error);
  }
  function frontmatterText(value) {
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (value === null || value === void 0) return "";
    return String(value);
  }

  // project/src/client/markdown.tsx
  var import_react = __toESM(__require("react"));
  var INLINE_PATTERN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;
  function safeHref(raw) {
    try {
      const url = new URL(raw, "https://skillhub.cn");
      return url.protocol === "http:" || url.protocol === "https:" ? raw : void 0;
    } catch {
      return void 0;
    }
  }
  function renderInline(text, keyPrefix, depth = 0) {
    if (text === "") return [];
    const nodes = [];
    const parts = text.split(INLINE_PATTERN);
    parts.forEach((part, index) => {
      if (part === "") return;
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        nodes.push(/* @__PURE__ */ import_react.default.createElement("strong", { key }, renderInline(part.slice(2, -2), key, depth + 1)));
        return;
      }
      if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
        nodes.push(/* @__PURE__ */ import_react.default.createElement("strong", { key }, renderInline(part.slice(2, -2), key, depth + 1)));
        return;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        nodes.push(/* @__PURE__ */ import_react.default.createElement("code", { key }, part.slice(1, -1)));
        return;
      }
      if (part.startsWith("[")) {
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link !== null) {
          const href = safeHref(link[2] ?? "");
          if (href === void 0) nodes.push(/* @__PURE__ */ import_react.default.createElement("span", { key }, link[1]));
          else nodes.push(/* @__PURE__ */ import_react.default.createElement("a", { key, href, target: "_blank", rel: "noreferrer noopener" }, renderInline(link[1] ?? "", key, depth + 1)));
          return;
        }
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2 || part.startsWith("_") && part.endsWith("_") && part.length > 2) {
        if (depth < 3) {
          nodes.push(/* @__PURE__ */ import_react.default.createElement("em", { key }, renderInline(part.slice(1, -1), key, depth + 1)));
          return;
        }
      }
      nodes.push(/* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, { key }, part));
    });
    return nodes;
  }
  function splitRow(line) {
    let value = line.trim();
    if (value.startsWith("|")) value = value.slice(1);
    if (value.endsWith("|")) value = value.slice(0, -1);
    return value.split("|").map((cell) => cell.trim());
  }
  function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
  }
  function startsBlock(line, next) {
    return /^\s*```/.test(line) || /^#{1,6}\s+/.test(line) || /^\s*>\s?/.test(line) || /^\s*([-*+]|\d+[.)])\s+/.test(line) || /^\s*(---+|\*\*\*+|___+)\s*$/.test(line) || line.includes("|") && next !== void 0 && isTableSeparator(next);
  }
  function renderBlocks(lines, keyPrefix, depth = 0) {
    const blocks = [];
    let index = 0;
    let blockIndex = 0;
    while (index < lines.length) {
      const line = lines[index] ?? "";
      const next = lines[index + 1];
      const key = `${keyPrefix}-b${blockIndex++}`;
      if (line.trim() === "") {
        index += 1;
        continue;
      }
      const fence = /^\s*```([\w-]*)\s*$/.exec(line);
      if (fence !== null) {
        const code = [];
        index += 1;
        while (index < lines.length && !/^\s*```\s*$/.test(lines[index] ?? "")) {
          code.push(lines[index] ?? "");
          index += 1;
        }
        index += 1;
        blocks.push(
          /* @__PURE__ */ import_react.default.createElement("pre", { key }, /* @__PURE__ */ import_react.default.createElement("code", { "data-lang": fence[1] || void 0 }, code.join("\n")))
        );
        continue;
      }
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading !== null) {
        const level = Math.min(6, (heading[1] ?? "#").length);
        const Tag = `h${level}`;
        blocks.push(/* @__PURE__ */ import_react.default.createElement(Tag, { key }, renderInline(heading[2] ?? "", key)));
        index += 1;
        continue;
      }
      if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
        blocks.push(/* @__PURE__ */ import_react.default.createElement("hr", { key }));
        index += 1;
        continue;
      }
      if (/^\s*>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? "")) {
          quote.push((lines[index] ?? "").replace(/^\s*>\s?/, ""));
          index += 1;
        }
        blocks.push(
          /* @__PURE__ */ import_react.default.createElement("blockquote", { key }, depth < 6 ? renderBlocks(quote, key, depth + 1) : /* @__PURE__ */ import_react.default.createElement("p", null, quote.join(" ")))
        );
        continue;
      }
      if (line.includes("|") && next !== void 0 && isTableSeparator(next)) {
        const header = splitRow(line);
        const rows = [];
        index += 2;
        while (index < lines.length) {
          const rowLine = lines[index] ?? "";
          if (rowLine.trim() === "" || !rowLine.includes("|")) break;
          rows.push(splitRow(rowLine));
          index += 1;
        }
        blocks.push(
          /* @__PURE__ */ import_react.default.createElement("table", { key }, /* @__PURE__ */ import_react.default.createElement("thead", null, /* @__PURE__ */ import_react.default.createElement("tr", null, header.map((cell, cellIndex) => /* @__PURE__ */ import_react.default.createElement("th", { key: `${key}-h${cellIndex}` }, renderInline(cell, `${key}-h${cellIndex}`))))), /* @__PURE__ */ import_react.default.createElement("tbody", null, rows.map((row, rowIndex) => /* @__PURE__ */ import_react.default.createElement("tr", { key: `${key}-r${rowIndex}` }, header.map((_, cellIndex) => /* @__PURE__ */ import_react.default.createElement("td", { key: `${key}-r${rowIndex}c${cellIndex}` }, renderInline(row[cellIndex] ?? "", `${key}-r${rowIndex}c${cellIndex}`)))))))
        );
        continue;
      }
      const listItem = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (listItem !== null) {
        const ordered = /\d/.test(listItem[2] ?? "");
        const baseIndent = (listItem[1] ?? "").length;
        const items = [];
        while (index < lines.length) {
          const current = lines[index] ?? "";
          const match = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(current);
          if (match !== null) {
            items.push({ text: match[3] ?? "", indent: (match[1] ?? "").length });
            index += 1;
            continue;
          }
          if (current.trim() === "") {
            index += 1;
            break;
          }
          if (/^\s+/.test(current) && items.length > 0) {
            const last = items[items.length - 1];
            if (last !== void 0) last.text += ` ${current.trim()}`;
            index += 1;
            continue;
          }
          break;
        }
        const Tag = ordered ? "ol" : "ul";
        blocks.push(
          /* @__PURE__ */ import_react.default.createElement(Tag, { key }, items.map((item, itemIndex) => /* @__PURE__ */ import_react.default.createElement(
            "li",
            {
              key: `${key}-i${itemIndex}`,
              style: item.indent > baseIndent ? { marginLeft: Math.min(24, (item.indent - baseIndent) * 8) } : void 0
            },
            renderInline(item.text, `${key}-i${itemIndex}`)
          )))
        );
        continue;
      }
      const paragraph = [line];
      index += 1;
      while (index < lines.length) {
        const current = lines[index] ?? "";
        if (current.trim() === "") break;
        if (startsBlock(current, lines[index + 1])) break;
        paragraph.push(current);
        index += 1;
      }
      blocks.push(/* @__PURE__ */ import_react.default.createElement("p", { key }, renderInline(paragraph.join(" "), key)));
    }
    return blocks;
  }
  function Markdown({ source, className }) {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    return /* @__PURE__ */ import_react.default.createElement("div", { className: `shm-md${className === void 0 ? "" : ` ${className}`}` }, renderBlocks(lines, "md"));
  }

  // project/src/client/ui.tsx
  var import_react2 = __toESM(__require("react"));
  var PATHS = {
    search: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m20 20-3.2-3.2" })),
    close: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M6 6l12 12M18 6 6 18" })),
    download: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 3v12" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m7 10 5 5 5-5" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M4 19h16" })),
    github: /* @__PURE__ */ import_react2.default.createElement("path", { d: "M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 4.5-1.4 4.5-5a4.4 4.4 0 0 0-1.2-3.1 4.1 4.1 0 0 0-.1-3.1s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C6.6 2.7 5.6 3 5.6 3a4.1 4.1 0 0 0-.1 3.1A4.4 4.4 0 0 0 4.3 9.2c0 3.6 1.7 4.7 4.5 5-.5.5-.5 1.1-.5 2V20" }),
    external: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M14 4h6v6" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m20 4-9 9" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" })),
    folder: /* @__PURE__ */ import_react2.default.createElement("path", { d: "M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" }),
    refresh: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M20 11a8 8 0 1 0-2.3 5.7" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M20 4v7h-7" })),
    alert: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 3 2.7 20h18.6z" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 9v5" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 17.5h.01" })),
    package: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "m12 3 8 4.5v9L12 21l-8-4.5v-9z" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m4 7.5 8 4.5 8-4.5" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 12v9" })),
    spark: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 3v4M12 17v4M3 12h4M17 12h4" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" })),
    check: /* @__PURE__ */ import_react2.default.createElement("path", { d: "m5 12 4.5 4.5L19 7" }),
    "chevron-left": /* @__PURE__ */ import_react2.default.createElement("path", { d: "m14 6-6 6 6 6" }),
    "chevron-right": /* @__PURE__ */ import_react2.default.createElement("path", { d: "m10 6 6 6-6 6" }),
    info: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 11v5" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 8h.01" })),
    tag: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M3 11V4h7l10 10-7 7z" }), /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "7.5", cy: "7.5", r: "1.2" })),
    layers: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "m12 3 9 5-9 5-9-5z" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m3 13 9 5 9-5" })),
    note: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M5 3h10l4 4v14H5z" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M15 3v5h5M8 12h8M8 16h6" })),
    clock: /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 7v5l3 2" }))
  };
  function Icon({ name, size = 16, className }) {
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        className,
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        focusable: "false"
      },
      PATHS[name]
    );
  }
  function Spinner({ size = 14 }) {
    return /* @__PURE__ */ import_react2.default.createElement("span", { className: "shm-spinner", style: { width: size, height: size }, "aria-hidden": "true" });
  }
  function Badge({ children, tone = "neutral", title }) {
    return /* @__PURE__ */ import_react2.default.createElement("span", { className: `shm-badge${tone === "neutral" ? "" : ` shm-badge-${tone}`}`, title }, children);
  }
  function Button({
    children,
    variant = "default",
    size = "sm",
    loading = false,
    icon,
    className = "",
    disabled,
    type = "button",
    ...rest
  }) {
    const classes = [
      "shm-btn",
      variant === "default" ? "" : `shm-btn-${variant}`,
      size === "lg" ? "shm-btn-lg" : "",
      className
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ import_react2.default.createElement("button", { ...rest, type, className: classes, disabled: disabled === true || loading, "aria-busy": loading || void 0 }, loading ? /* @__PURE__ */ import_react2.default.createElement(Spinner, null) : icon === void 0 ? null : /* @__PURE__ */ import_react2.default.createElement(Icon, { name: icon, size: 14 }), children);
  }
  function Modal({
    title,
    subtitle,
    onClose,
    children,
    footer,
    size = "md"
  }) {
    import_react2.default.useEffect(() => {
      const onKey = (event) => {
        if (event.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);
    return /* @__PURE__ */ import_react2.default.createElement("div", { className: "shm-overlay", onMouseDown: (event) => {
      if (event.target === event.currentTarget) onClose();
    } }, /* @__PURE__ */ import_react2.default.createElement("div", { className: `shm-modal${size === "sm" ? " shm-modal-sm" : size === "wide" ? " shm-modal-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": typeof title === "string" ? title : void 0 }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "shm-modal-head" }, /* @__PURE__ */ import_react2.default.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ import_react2.default.createElement("h2", { className: "shm-modal-title" }, title), subtitle === void 0 ? null : /* @__PURE__ */ import_react2.default.createElement("p", { className: "shm-modal-sub" }, subtitle)), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", className: "shm-iconbtn", onClick: onClose, "aria-label": "close" }, /* @__PURE__ */ import_react2.default.createElement(Icon, { name: "close", size: 17 }))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "shm-modal-body" }, children), footer === void 0 ? null : /* @__PURE__ */ import_react2.default.createElement("div", { className: "shm-modal-foot" }, footer)));
  }
  function Toast({ message, tone = "info" }) {
    return /* @__PURE__ */ import_react2.default.createElement("div", { className: `shm-toast${tone === "info" ? "" : ` shm-toast-${tone}`}`, role: "status" }, /* @__PURE__ */ import_react2.default.createElement(Icon, { name: tone === "success" ? "check" : tone === "error" ? "alert" : "info", size: 15 }), /* @__PURE__ */ import_react2.default.createElement("span", null, message));
  }

  // project/src/client/downloaded.tsx
  function metaText(value) {
    if (value === void 0 || value === null || value === "") return "";
    return frontmatterText(value);
  }
  function metaSignature(displayName, note) {
    return JSON.stringify([displayName.trim(), note.trim()]);
  }
  function DownloadedTab({ api, t, notify, version, onGoMarket }) {
    const [data, setData] = import_react3.default.useState(null);
    const [meta, setMeta] = import_react3.default.useState({});
    const [loading, setLoading] = import_react3.default.useState(true);
    const [error, setError] = import_react3.default.useState(null);
    const [reload, setReload] = import_react3.default.useState(0);
    const [selected, setSelected] = import_react3.default.useState(null);
    const [detailLoading, setDetailLoading] = import_react3.default.useState(false);
    const [detailError, setDetailError] = import_react3.default.useState(null);
    const [displayName, setDisplayName] = import_react3.default.useState("");
    const [note, setNote] = import_react3.default.useState("");
    const [saving, setSaving] = import_react3.default.useState(false);
    const [saved, setSaved] = import_react3.default.useState(false);
    const [savedSignature, setSavedSignature] = import_react3.default.useState("");
    const savingRef = import_react3.default.useRef(false);
    const [busyFolder, setBusyFolder] = import_react3.default.useState(null);
    const detailAbort = import_react3.default.useRef(null);
    import_react3.default.useEffect(() => {
      const controller = new AbortController();
      setLoading(true);
      setError(null);
      Promise.all([
        api.installed(controller.signal),
        api.custom(controller.signal).catch(() => ({ data: {} }))
      ]).then(([list, custom]) => {
        if (controller.signal.aborted) return;
        setData(list);
        setMeta(custom.data);
      }).catch((reason) => {
        if (controller.signal.aborted) return;
        setError(errorText(reason, t));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [api, t, version, reload]);
    import_react3.default.useEffect(() => () => detailAbort.current?.abort(), []);
    const openSkill = (skill) => {
      detailAbort.current?.abort();
      const controller = new AbortController();
      detailAbort.current = controller;
      setSelected(skill);
      setDetailError(null);
      setDetailLoading(true);
      setSaved(false);
      const savedMeta = meta[skill.slug] ?? meta[skill.name] ?? {};
      setDisplayName(savedMeta.displayName ?? "");
      setNote(savedMeta.note ?? "");
      setSavedSignature(metaSignature(savedMeta.displayName ?? "", savedMeta.note ?? ""));
      api.installedDetail(skill.slug, controller.signal).then((detail) => {
        if (controller.signal.aborted) return;
        setSelected(detail);
        const freshMeta = meta[detail.slug] ?? meta[detail.name] ?? {};
        setDisplayName(freshMeta.displayName ?? "");
        setNote(freshMeta.note ?? "");
        setSavedSignature(metaSignature(freshMeta.displayName ?? "", freshMeta.note ?? ""));
      }).catch((reason) => {
        if (!controller.signal.aborted) setDetailError(errorText(reason, t));
      }).finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    };
    const closeSkill = () => {
      detailAbort.current?.abort();
      setSelected(null);
      setDetailError(null);
      setDetailLoading(false);
    };
    const saveMeta = async () => {
      if (selected === null || savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      try {
        await api.saveCustom(selected.slug, displayName.trim(), note.trim());
        const effectiveName = displayName.trim() || selected.name || selected.slug;
        setSelected((previous) => previous === null ? null : {
          ...previous,
          displayName: effectiveName,
          ...note.trim() === "" ? { note: void 0 } : { note: note.trim() }
        });
        setData((previous) => previous === null ? null : {
          ...previous,
          skills: previous.skills.map((skill) => skill.slug === selected.slug ? { ...skill, displayName: effectiveName, ...note.trim() === "" ? { note: void 0 } : { note: note.trim() } } : skill)
        });
        setSaved(true);
        setSavedSignature(metaSignature(displayName, note));
        notify("success", t("toast.saved"));
        setReload((value) => value + 1);
      } catch (reason) {
        notify("error", t("toast.saveFailed", { message: errorText(reason, t) }));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    };
    const saveOnBlur = () => {
      if (selected === null || savingRef.current) return;
      if (metaSignature(displayName, note) !== savedSignature) void saveMeta();
    };
    const openFolder = async (skill) => {
      setBusyFolder(skill.slug);
      try {
        await api.openFolder(skill.slug);
      } catch (reason) {
        notify("error", t("toast.openFailed", { message: errorText(reason, t) }));
      } finally {
        setBusyFolder(null);
      }
    };
    const total = data?.skills.length ?? 0;
    const selName = selected === null ? "" : selected.displayName || selected.name || selected.slug;
    const selDescription = selected === null ? "" : selected.description || selected.descriptionZh || "";
    return /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-pane" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-dl-head" }, /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, minWidth: 220 } }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-dl-path" }, t("downloaded.root"), "\uFF1A", /* @__PURE__ */ import_react3.default.createElement("code", null, data?.skillsRoot ?? "$DSH_HOME/skills")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-count", style: { marginTop: 4 } }, loading && data === null ? t("downloaded.loading") : t("downloaded.count", { count: total }))), /* @__PURE__ */ import_react3.default.createElement(Button, { icon: "refresh", loading, onClick: () => setReload((value) => value + 1) }, t("downloaded.refresh"))), data?.metaError === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-warnbox" }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "alert", size: 15 }), t("downloaded.metaError", { message: data.metaError })), error !== null ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-error", role: "alert" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-error-icon" }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "alert", size: 22 })), /* @__PURE__ */ import_react3.default.createElement("h3", null, t("downloaded.error")), /* @__PURE__ */ import_react3.default.createElement("p", null, error), /* @__PURE__ */ import_react3.default.createElement(Button, { icon: "refresh", onClick: () => setReload((value) => value + 1) }, t("common.retry"))) : loading && data === null ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-skeletons" }, Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-skeleton", key: index, style: { height: 190 } }))) : data !== null && data.skills.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-empty" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-empty-icon" }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "package", size: 22 })), /* @__PURE__ */ import_react3.default.createElement("h3", null, t("downloaded.empty")), /* @__PURE__ */ import_react3.default.createElement("p", null, t("downloaded.emptyHint")), /* @__PURE__ */ import_react3.default.createElement(Button, { variant: "primary", icon: "search", onClick: onGoMarket }, t("tab.market"))) : data !== null ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-dl-grid" }, data.skills.map((skill) => {
      const name = skill.displayName || skill.name || skill.slug;
      const description = skill.description || skill.descriptionZh || skill.slug;
      const custom = meta[skill.slug]?.displayName !== void 0 && meta[skill.slug]?.displayName !== "";
      return /* @__PURE__ */ import_react3.default.createElement("article", { className: "shm-dl-card", key: skill.slug }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-dl-card-head" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-avatar" }, initials(name)), /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "shm-dl-name", title: name }, name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-dl-slug" }, skill.slug, skill.version === void 0 ? "" : ` \xB7 v${skill.version}`)), custom ? /* @__PURE__ */ import_react3.default.createElement(Badge, { tone: "blue" }, t("downloaded.displayName")) : null), skill.error === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-badges" }, /* @__PURE__ */ import_react3.default.createElement(Badge, { tone: "danger" }, skill.error)), /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-dl-desc" }, description === "" ? "\u2014" : description), skill.note === void 0 || skill.note === "" ? null : /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-dl-note" }, skill.note), /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-badges" }, skill.category === void 0 || skill.category === "" ? null : /* @__PURE__ */ import_react3.default.createElement(Badge, null, skill.category), skill.requiresApiKey === true ? /* @__PURE__ */ import_react3.default.createElement(Badge, { tone: "warn" }, t("card.apiKeyRequired")) : null, skill.updatedAt === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement(Badge, null, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "clock", size: 11 }), formatDate(skill.updatedAt))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-dl-foot" }, /* @__PURE__ */ import_react3.default.createElement(Button, { variant: "soft", onClick: () => openSkill(skill) }, t("downloaded.viewDetail")), /* @__PURE__ */ import_react3.default.createElement(Button, { icon: "folder", loading: busyFolder === skill.slug, onClick: () => {
        void openFolder(skill);
      } }, t("downloaded.openFolder")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "shm-spacer" }), skill.githubUrl === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("a", { className: "shm-iconbtn", href: skill.githubUrl, target: "_blank", rel: "noreferrer noopener", title: t("downloaded.openGithub"), "aria-label": t("downloaded.openGithub") }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "github", size: 15 }))));
    })) : null, selected === null ? null : /* @__PURE__ */ import_react3.default.createElement(
      Modal,
      {
        title: selName,
        subtitle: `${selected.slug} \xB7 ${selected.path}`,
        size: "wide",
        onClose: closeSkill,
        footer: /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(Button, { variant: "ghost", onClick: closeSkill }, t("common.close")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "shm-spacer" }), /* @__PURE__ */ import_react3.default.createElement(Button, { icon: "folder", loading: busyFolder === selected.slug, onClick: () => {
          void openFolder(selected);
        } }, t("downloaded.openFolder")), selected.githubUrl === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("a", { className: "shm-btn", href: selected.githubUrl, target: "_blank", rel: "noreferrer noopener" }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "github", size: 14 }), t("downloaded.openGithub")))
      },
      detailLoading ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-loading", style: { padding: "8px 0" } }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "shm-loading-title" }, /* @__PURE__ */ import_react3.default.createElement(Spinner, null), t("common.loading"))) : null,
      detailError === null ? null : /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-warnbox" }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "alert", size: 15 }), t("downloaded.detailError"), "\uFF1A", detailError),
      /* @__PURE__ */ import_react3.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-editor" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-field-block" }, /* @__PURE__ */ import_react3.default.createElement("label", { htmlFor: "shm-display-name" }, t("downloaded.displayName")), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          id: "shm-display-name",
          className: "shm-input",
          value: displayName,
          placeholder: t("downloaded.displayNamePlaceholder"),
          onChange: (event) => {
            setDisplayName(event.target.value);
            setSaved(false);
          },
          onBlur: saveOnBlur
        }
      ), /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-hint" }, t("downloaded.customNameHint"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-field-block" }, /* @__PURE__ */ import_react3.default.createElement("label", { htmlFor: "shm-note" }, t("downloaded.note")), /* @__PURE__ */ import_react3.default.createElement(
        "textarea",
        {
          id: "shm-note",
          className: "shm-input",
          value: note,
          placeholder: t("downloaded.notePlaceholder"),
          onChange: (event) => {
            setNote(event.target.value);
            setSaved(false);
          },
          onBlur: saveOnBlur
        }
      ), /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-hint" }, t("downloaded.reinstallHint"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "shm-editor-actions" }, /* @__PURE__ */ import_react3.default.createElement(Button, { variant: "primary", loading: saving, onClick: () => {
        void saveMeta();
      } }, saving ? t("downloaded.saving") : t("downloaded.save")), saved ? /* @__PURE__ */ import_react3.default.createElement("span", { className: "shm-saved" }, /* @__PURE__ */ import_react3.default.createElement(Icon, { name: "check", size: 13 }), " ", t("toast.saved")) : null))),
      selDescription === "" ? null : /* @__PURE__ */ import_react3.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "shm-section-title" }, t("downloaded.description")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-overview" }, selDescription)),
      /* @__PURE__ */ import_react3.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "shm-section-title" }, t("detail.meta")), /* @__PURE__ */ import_react3.default.createElement("dl", { className: "shm-kv" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("downloaded.originalName")), /* @__PURE__ */ import_react3.default.createElement("dd", null, selected.name || "\u2014")), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("downloaded.slug")), /* @__PURE__ */ import_react3.default.createElement("dd", null, selected.slug)), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("downloaded.dir")), /* @__PURE__ */ import_react3.default.createElement("dd", { style: { overflowWrap: "anywhere" } }, selected.path)), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("detail.version")), /* @__PURE__ */ import_react3.default.createElement("dd", null, selected.version ?? "\u2014")), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("detail.category")), /* @__PURE__ */ import_react3.default.createElement("dd", null, selected.category ?? "\u2014")), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("detail.source")), /* @__PURE__ */ import_react3.default.createElement("dd", null, sourceLabel(selected.frontmatter.source, t))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("detail.updated")), /* @__PURE__ */ import_react3.default.createElement("dd", null, formatDate(selected.updatedAt))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("dt", null, t("detail.requiresApiKey")), /* @__PURE__ */ import_react3.default.createElement("dd", null, selected.requiresApiKey === void 0 ? "\u2014" : selected.requiresApiKey ? t("detail.yes") : t("detail.no"))))),
      Object.keys(selected.frontmatter).length === 0 ? null : /* @__PURE__ */ import_react3.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "shm-section-title" }, t("downloaded.frontmatter")), /* @__PURE__ */ import_react3.default.createElement("dl", { className: "shm-kv" }, Object.entries(selected.frontmatter).map(([key, value]) => /* @__PURE__ */ import_react3.default.createElement("div", { key }, /* @__PURE__ */ import_react3.default.createElement("dt", null, key), /* @__PURE__ */ import_react3.default.createElement("dd", null, metaText(value) || "\u2014"))))),
      /* @__PURE__ */ import_react3.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "shm-section-title" }, t("downloaded.body")), selected.body.trim() === "" ? /* @__PURE__ */ import_react3.default.createElement("p", { className: "shm-overview" }, t("downloaded.noBody")) : /* @__PURE__ */ import_react3.default.createElement(Markdown, { source: selected.body }))
    ));
  }

  // project/src/client/market.tsx
  var import_react4 = __toESM(__require("react"));
  var PAGE_SIZE = 24;
  var SORTS = ["all", "trending", "downloads", "newest"];
  var SOURCES = ["all", "community", "clawhub", "enterprise"];
  var API_KEYS = ["all", "required", "none"];
  function Avatar({ src, label }) {
    const [failed, setFailed] = import_react4.default.useState(false);
    import_react4.default.useEffect(() => setFailed(false), [src]);
    if (src === void 0 || src === "" || failed) return /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-avatar" }, initials(label));
    return /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-avatar" }, /* @__PURE__ */ import_react4.default.createElement("img", { src, alt: "", loading: "lazy", onError: () => setFailed(true) }));
  }
  function categoryName(key, options) {
    if (key === void 0 || key === "") return "";
    return options.find((option) => option.key === key)?.name ?? key;
  }
  function MarketTab({ api, t, notify, onInstalled }) {
    const [keywordInput, setKeywordInput] = import_react4.default.useState("");
    const [keyword, setKeyword] = import_react4.default.useState("");
    const [sort, setSort] = import_react4.default.useState("all");
    const [source, setSource] = import_react4.default.useState("all");
    const [category, setCategory] = import_react4.default.useState("all");
    const [apiKey, setApiKey] = import_react4.default.useState("all");
    const [page, setPage] = import_react4.default.useState(1);
    const [reload, setReload] = import_react4.default.useState(0);
    const [result, setResult] = import_react4.default.useState(null);
    const [loading, setLoading] = import_react4.default.useState(true);
    const [error, setError] = import_react4.default.useState(null);
    const [categories, setCategories] = import_react4.default.useState([]);
    const [categoryFallback, setCategoryFallback] = import_react4.default.useState(false);
    const [installed, setInstalled] = import_react4.default.useState(/* @__PURE__ */ new Set());
    const [detailSkill, setDetailSkill] = import_react4.default.useState(null);
    const [detailLoading, setDetailLoading] = import_react4.default.useState(false);
    const [detailError, setDetailError] = import_react4.default.useState(null);
    const [busySlug, setBusySlug] = import_react4.default.useState(null);
    const [overwrite, setOverwrite] = import_react4.default.useState(null);
    const detailAbort = import_react4.default.useRef(null);
    import_react4.default.useEffect(() => {
      const timer = window.setTimeout(() => {
        setKeyword(keywordInput.trim());
        setPage(1);
      }, 350);
      return () => window.clearTimeout(timer);
    }, [keywordInput]);
    import_react4.default.useEffect(() => {
      const controller = new AbortController();
      api.categories(controller.signal).then((response) => {
        if (controller.signal.aborted) return;
        setCategories(response.items);
        setCategoryFallback(response.fallback === true);
      }).catch(() => {
      });
      return () => controller.abort();
    }, [api]);
    import_react4.default.useEffect(() => {
      const controller = new AbortController();
      api.installed(controller.signal).then((response) => {
        if (!controller.signal.aborted) setInstalled(new Set(response.skills.map((skill) => skill.slug)));
      }).catch(() => {
      });
      return () => controller.abort();
    }, [api]);
    import_react4.default.useEffect(() => {
      const controller = new AbortController();
      const query = {
        keyword,
        page,
        pageSize: PAGE_SIZE,
        sort,
        source,
        category,
        apiKey
      };
      setLoading(true);
      setError(null);
      api.list(query, controller.signal).then((response) => {
        if (controller.signal.aborted) return;
        setResult(response);
      }).catch((reason) => {
        if (controller.signal.aborted) return;
        setError(errorText(reason, t));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [api, keyword, sort, source, category, apiKey, page, reload]);
    import_react4.default.useEffect(() => () => detailAbort.current?.abort(), []);
    const total = result?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const activeFilters = keyword !== "" || sort !== "all" || source !== "all" || category !== "all" || apiKey !== "all";
    const resetFilters = () => {
      setKeywordInput("");
      setKeyword("");
      setSort("all");
      setSource("all");
      setCategory("all");
      setApiKey("all");
      setPage(1);
    };
    const openDetail = (skill) => {
      detailAbort.current?.abort();
      const controller = new AbortController();
      detailAbort.current = controller;
      setDetailSkill(skill);
      setDetailError(null);
      setDetailLoading(true);
      api.detail(skill.slug, skill.namespaceHandle, controller.signal).then((detail) => {
        if (!controller.signal.aborted) setDetailSkill(detail);
      }).catch((reason) => {
        if (controller.signal.aborted) return;
        notify("error", t("toast.detailFailed", { message: errorText(reason, t) }));
        setDetailError(errorText(reason, t));
      }).finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    };
    const closeDetail = () => {
      detailAbort.current?.abort();
      setDetailSkill(null);
      setDetailError(null);
      setDetailLoading(false);
    };
    const install = async (skill, overwriteExisting) => {
      setBusySlug(skill.slug);
      try {
        const result2 = await api.install(
          skill.slug,
          overwriteExisting,
          skill.githubUrl ?? skill.homepage ?? void 0
        );
        setInstalled((previous) => new Set(previous).add(result2.slug));
        setOverwrite(null);
        notify("success", t("toast.installSuccess", { name: skill.displayName || skill.name || skill.slug }));
        if (result2.metaWarning !== void 0) notify("info", t("toast.installMetaWarning", { message: result2.metaWarning }));
        onInstalled();
      } catch (reason) {
        if (reason instanceof ApiError && reason.status === 409) {
          setOverwrite(skill);
        } else {
          notify("error", t("toast.installFailed", { message: errorText(reason, t) }));
        }
      } finally {
        setBusySlug(null);
      }
    };
    const detailName = detailSkill === null ? "" : detailSkill.displayName || detailSkill.name || detailSkill.slug;
    const detailDescription = detailSkill === null ? "" : detailSkill.description || detailSkill.descriptionZh || "";
    return /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-pane" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-toolbar" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-search" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "search", size: 16 }), /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        value: keywordInput,
        onChange: (event) => setKeywordInput(event.target.value),
        placeholder: t("search.placeholder"),
        "aria-label": t("search.placeholder"),
        spellCheck: false
      }
    ), keywordInput === "" ? null : /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", className: "shm-iconbtn", "aria-label": t("search.clear"), onClick: () => setKeywordInput("") }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "close", size: 15 }))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-sort", role: "group", "aria-label": t("sort.label") }, SORTS.map((option) => /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        key: option,
        type: "button",
        className: "shm-sortbtn",
        "aria-pressed": sort === option,
        title: option === "trending" ? t("sort.trendingHint") : void 0,
        onClick: () => {
          setSort(option);
          setPage(1);
        }
      },
      t(`sort.${option}`)
    )))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-filters" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-field" }, /* @__PURE__ */ import_react4.default.createElement("label", { htmlFor: "shm-source" }, t("filter.source")), /* @__PURE__ */ import_react4.default.createElement("select", { id: "shm-source", className: "shm-select", value: source, onChange: (event) => {
      setSource(event.target.value);
      setPage(1);
    } }, SOURCES.map((option) => /* @__PURE__ */ import_react4.default.createElement("option", { key: option, value: option }, option === "all" ? t("filter.all") : t(`source.${option}`))))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-field" }, /* @__PURE__ */ import_react4.default.createElement("label", { htmlFor: "shm-category" }, t("filter.category")), /* @__PURE__ */ import_react4.default.createElement(
      "select",
      {
        id: "shm-category",
        className: "shm-select",
        value: category,
        title: categoryFallback ? t("list.error") : void 0,
        onChange: (event) => {
          setCategory(event.target.value);
          setPage(1);
        }
      },
      /* @__PURE__ */ import_react4.default.createElement("option", { value: "all" }, t("filter.all")),
      categories.map((option) => /* @__PURE__ */ import_react4.default.createElement("option", { key: option.key, value: option.key }, option.name))
    )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-field" }, /* @__PURE__ */ import_react4.default.createElement("label", { htmlFor: "shm-apikey" }, t("filter.apiKey")), /* @__PURE__ */ import_react4.default.createElement("select", { id: "shm-apikey", className: "shm-select", value: apiKey, onChange: (event) => {
      setApiKey(event.target.value);
      setPage(1);
    } }, API_KEYS.map((option) => /* @__PURE__ */ import_react4.default.createElement("option", { key: option, value: option }, option === "all" ? t("filter.all") : option === "required" ? t("apiKey.required") : t("apiKey.none"))))), activeFilters ? /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", className: "shm-reset", onClick: resetFilters }, t("filter.reset")) : null), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-summary", "aria-live": "polite" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "shm-count" }, loading && result === null ? t("list.loading") : t("list.total", { total }), " \xB7 ", t("list.pageSize", { size: PAGE_SIZE })), loading && result !== null ? /* @__PURE__ */ import_react4.default.createElement(Spinner, { size: 12 }) : null), error !== null ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-error", role: "alert" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-error-icon" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "alert", size: 22 })), /* @__PURE__ */ import_react4.default.createElement("h3", null, t("list.error")), /* @__PURE__ */ import_react4.default.createElement("p", null, error), /* @__PURE__ */ import_react4.default.createElement(Button, { icon: "refresh", onClick: () => setReload((value) => value + 1) }, t("list.retry"))) : loading && result === null ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-skeletons", "aria-label": t("list.loading") }, Array.from({ length: 6 }, (_, index) => /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-skeleton", key: index }))) : result !== null && result.items.length === 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-empty" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-empty-icon" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "search", size: 22 })), /* @__PURE__ */ import_react4.default.createElement("h3", null, t("list.empty")), /* @__PURE__ */ import_react4.default.createElement("p", null, t("list.emptyHint")), activeFilters ? /* @__PURE__ */ import_react4.default.createElement(Button, { icon: "refresh", onClick: resetFilters }, t("filter.reset")) : null) : result !== null ? /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-grid" }, result.items.map((skill) => {
      const name = skill.displayName || skill.name || skill.slug;
      const description = skill.description || skill.descriptionZh || "";
      const isInstalled = installed.has(skill.slug);
      const busy = busySlug === skill.slug;
      return /* @__PURE__ */ import_react4.default.createElement("article", { className: "shm-card", key: skill.slug }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-card-head" }, /* @__PURE__ */ import_react4.default.createElement(Avatar, { src: skill.iconUrl, label: name }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-card-title" }, /* @__PURE__ */ import_react4.default.createElement("h3", { className: "shm-card-name", title: name }, name), /* @__PURE__ */ import_react4.default.createElement("p", { className: "shm-card-sub" }, sourceLabel(skill.source, t), skill.category === void 0 || skill.category === "" ? "" : ` \xB7 ${categoryName(skill.category, categories)}`)), isInstalled ? /* @__PURE__ */ import_react4.default.createElement(Badge, { tone: "green" }, t("card.installed")) : null), /* @__PURE__ */ import_react4.default.createElement("p", { className: "shm-card-desc", title: description }, description === "" ? "\u2014" : description), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-badges" }, skill.requiresApiKey === true ? /* @__PURE__ */ import_react4.default.createElement(Badge, { tone: "warn" }, t("card.apiKeyRequired")) : null, skill.requiresApiKey === false ? /* @__PURE__ */ import_react4.default.createElement(Badge, null, t("card.apiKeyNone")) : null, skill.version === void 0 || skill.version === "" ? null : /* @__PURE__ */ import_react4.default.createElement(Badge, null, skill.version), (skill.tags ?? []).slice(0, 2).map((tag) => /* @__PURE__ */ import_react4.default.createElement(Badge, { key: tag }, "#", tag))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-card-meta" }, /* @__PURE__ */ import_react4.default.createElement("span", null, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "download", size: 13 }), formatCount(skill.downloads)), /* @__PURE__ */ import_react4.default.createElement("span", null, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "spark", size: 13 }), formatCount(skill.stars)), /* @__PURE__ */ import_react4.default.createElement("span", null, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "clock", size: 13 }), formatDate(skill.updatedAt))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-card-foot" }, /* @__PURE__ */ import_react4.default.createElement(Button, { variant: "soft", onClick: () => openDetail(skill) }, t("card.view")), skill.githubUrl !== void 0 ? /* @__PURE__ */ import_react4.default.createElement("a", { className: "shm-btn", href: skill.githubUrl, target: "_blank", rel: "noreferrer noopener" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "github", size: 14 }), t("card.github")) : /* @__PURE__ */ import_react4.default.createElement("a", { className: "shm-btn", href: skill.skillhubUrl, target: "_blank", rel: "noreferrer noopener" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "external", size: 14 }), t("card.skillhub")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "shm-spacer" }), skill.githubUrl === void 0 ? null : /* @__PURE__ */ import_react4.default.createElement("a", { className: "shm-iconbtn", href: skill.skillhubUrl, target: "_blank", rel: "noreferrer noopener", title: t("card.skillhub"), "aria-label": t("card.skillhub") }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "external", size: 15 })), /* @__PURE__ */ import_react4.default.createElement(
        Button,
        {
          variant: "primary",
          loading: busy,
          disabled: busySlug !== null,
          onClick: () => {
            void install(skill, false);
          }
        },
        busy ? t("card.downloading") : isInstalled ? t("card.redownload") : t("card.download")
      )));
    })), pages > 1 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-pagination" }, /* @__PURE__ */ import_react4.default.createElement(Button, { icon: "chevron-left", disabled: page <= 1 || loading, onClick: () => setPage((value) => Math.max(1, value - 1)) }, t("list.prev")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "shm-page-info" }, t("list.page", { page, pages })), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: page >= pages || loading, onClick: () => setPage((value) => Math.min(pages, value + 1)) }, t("list.next"), /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "chevron-right", size: 14 }))) : null) : null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-footer" }, t("footer.sourceApi")), detailSkill === null ? null : /* @__PURE__ */ import_react4.default.createElement(
      Modal,
      {
        title: detailName,
        subtitle: detailSkill.slug,
        size: "wide",
        onClose: closeDetail,
        footer: /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(Button, { variant: "ghost", onClick: closeDetail }, t("common.close")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "shm-spacer" }), /* @__PURE__ */ import_react4.default.createElement("a", { className: "shm-btn", href: detailSkill.skillhubUrl, target: "_blank", rel: "noreferrer noopener" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "external", size: 14 }), t("detail.skillhub")), detailSkill.githubUrl === void 0 ? null : /* @__PURE__ */ import_react4.default.createElement("a", { className: "shm-btn", href: detailSkill.githubUrl, target: "_blank", rel: "noreferrer noopener" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "github", size: 14 }), t("detail.github")), /* @__PURE__ */ import_react4.default.createElement(
          Button,
          {
            variant: "primary",
            loading: busySlug === detailSkill.slug,
            disabled: busySlug !== null,
            onClick: () => {
              void install(detailSkill, false);
            }
          },
          busySlug === detailSkill.slug ? t("detail.installing") : t("detail.install")
        ))
      },
      detailLoading ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-loading" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "shm-loading-title" }, /* @__PURE__ */ import_react4.default.createElement(Spinner, null), t("detail.loading"))) : null,
      detailError === null ? null : /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-warnbox" }, /* @__PURE__ */ import_react4.default.createElement(Icon, { name: "alert", size: 15 }), t("detail.error")),
      detailDescription === "" ? null : /* @__PURE__ */ import_react4.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react4.default.createElement("h3", { className: "shm-section-title" }, t("detail.overview")), /* @__PURE__ */ import_react4.default.createElement("p", { className: "shm-overview" }, detailDescription)),
      /* @__PURE__ */ import_react4.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react4.default.createElement("h3", { className: "shm-section-title" }, t("detail.meta")), /* @__PURE__ */ import_react4.default.createElement("dl", { className: "shm-kv" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.source")), /* @__PURE__ */ import_react4.default.createElement("dd", null, sourceLabel(detailSkill.source, t))), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.category")), /* @__PURE__ */ import_react4.default.createElement("dd", null, categoryName(detailSkill.category, categories) || "\u2014")), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.version")), /* @__PURE__ */ import_react4.default.createElement("dd", null, detailSkill.version ?? "\u2014")), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.updated")), /* @__PURE__ */ import_react4.default.createElement("dd", null, formatDate(detailSkill.updatedAt))), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.downloads")), /* @__PURE__ */ import_react4.default.createElement("dd", null, formatCount(detailSkill.downloads))), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.stars")), /* @__PURE__ */ import_react4.default.createElement("dd", null, formatCount(detailSkill.stars))), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.installs")), /* @__PURE__ */ import_react4.default.createElement("dd", null, formatCount(detailSkill.installs))), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("dt", null, t("detail.requiresApiKey")), /* @__PURE__ */ import_react4.default.createElement("dd", null, detailSkill.requiresApiKey === void 0 ? "\u2014" : detailSkill.requiresApiKey ? t("detail.yes") : t("detail.no"))))),
      (detailSkill.tags ?? []).length === 0 ? null : /* @__PURE__ */ import_react4.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react4.default.createElement("h3", { className: "shm-section-title" }, t("detail.tags")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "shm-taglist" }, detailSkill.tags.map((tag) => /* @__PURE__ */ import_react4.default.createElement(Badge, { key: tag }, "#", tag)))),
      detailSkill.overviewMd === void 0 || detailSkill.overviewMd === "" ? null : /* @__PURE__ */ import_react4.default.createElement("section", { className: "shm-section" }, /* @__PURE__ */ import_react4.default.createElement("h3", { className: "shm-section-title" }, t("detail.overview")), /* @__PURE__ */ import_react4.default.createElement(Markdown, { source: detailSkill.overviewMd }))
    ), overwrite === null ? null : /* @__PURE__ */ import_react4.default.createElement(
      Modal,
      {
        title: t("overwrite.title"),
        size: "sm",
        onClose: () => {
          if (busySlug === null) setOverwrite(null);
        },
        footer: /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(Button, { variant: "ghost", disabled: busySlug !== null, onClick: () => setOverwrite(null) }, t("overwrite.cancel")), /* @__PURE__ */ import_react4.default.createElement(
          Button,
          {
            variant: "danger",
            loading: busySlug === overwrite.slug,
            disabled: busySlug !== null,
            onClick: () => {
              void install(overwrite, true);
            }
          },
          t("overwrite.confirm")
        ))
      },
      /* @__PURE__ */ import_react4.default.createElement("p", { className: "shm-overview" }, t("overwrite.body", {
        name: overwrite.displayName || overwrite.name || overwrite.slug,
        path: "DSH skills/" + overwrite.slug
      }))
    ));
  }

  // project/src/client/styles.ts
  var styles = `
.shm-root {
  --shm-surface: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 92%, var(--dsw-alias-label-primary, #111) 4%);
  --shm-surface-strong: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 86%, var(--dsw-alias-label-primary, #111) 8%);
  --shm-border: color-mix(in srgb, var(--dsw-alias-border-l3, #888) 55%, transparent);
  --shm-text: var(--dsw-alias-label-primary, #111);
  --shm-muted: var(--dsw-alias-label-tertiary, #6b7280);
  --shm-accent: var(--dsw-static-blue-500, #3b82f6);
  --shm-accent-soft: color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 12%, transparent);
  --shm-danger: var(--dsw-alias-state-error-primary, #dc2626);
  --shm-success: var(--dsw-alias-state-success-primary, #16a34a);
  --shm-warn: var(--dsw-alias-state-warn-primary, #d97706);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--shm-text);
  background: var(--dsw-alias-bg-base, #fff);
  font-size: 14px;
  line-height: 1.55;
}
.shm-root *, .shm-root *::before, .shm-root *::after { box-sizing: border-box; }
.shm-root button, .shm-root input, .shm-root select, .shm-root textarea { font: inherit; color: inherit; }
.shm-root a { color: var(--shm-accent); text-decoration: none; }
.shm-root a:hover { text-decoration: underline; }
.shm-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.shm-root ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--shm-muted) 30%, transparent);
  border-radius: 8px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.shm-header {
  flex: none;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 24px 0;
  border-bottom: 1px solid var(--shm-border);
  background: var(--dsw-alias-bg-base, #fff);
  z-index: 3;
}
.shm-brand { display: flex; align-items: center; gap: 12px; min-width: 0; padding-bottom: 14px; }
.shm-logo {
  width: 38px; height: 38px; flex: none;
  display: grid; place-items: center;
  border-radius: 12px;
  color: var(--dsw-alias-label-primary-inverted, #fff);
  background: linear-gradient(140deg, var(--dsw-static-blue-400, #60a5fa), var(--dsw-static-blue-600, #2563eb));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 30%, transparent);
}
.shm-title { margin: 0; font-size: 17px; font-weight: 650; letter-spacing: -0.01em; white-space: nowrap; }
.shm-sub { margin: 0; color: var(--shm-muted); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shm-tabs { display: flex; gap: 4px; align-self: flex-end; margin-left: auto; }
.shm-tab {
  border: 0; background: transparent; cursor: pointer;
  padding: 10px 14px 12px;
  color: var(--shm-muted);
  border-bottom: 2px solid transparent;
  font-weight: 550;
  transition: color .15s, border-color .15s;
}
.shm-tab:hover { color: var(--shm-text); }
.shm-tab[aria-selected="true"] { color: var(--shm-text); border-bottom-color: var(--shm-accent); }
.shm-tab-count {
  display: inline-block; margin-left: 6px; padding: 0 6px;
  border-radius: 999px; font-size: 11px; line-height: 18px;
  background: var(--shm-surface-strong); color: var(--shm-muted);
}

.shm-main { flex: 1; min-height: 0; overflow: auto; padding: 18px 24px 32px; }
.shm-pane[hidden] { display: none !important; }
.shm-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.shm-search {
  flex: 1 1 320px; min-width: 220px;
  display: flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 10px 0 12px;
  border: 1px solid var(--shm-border); border-radius: 10px;
  background: var(--shm-surface);
  transition: border-color .15s, box-shadow .15s;
}
.shm-search:focus-within { border-color: var(--shm-accent); box-shadow: 0 0 0 3px var(--shm-accent-soft); }
.shm-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; height: 100%; }
.shm-search input::placeholder { color: var(--shm-muted); }
.shm-iconbtn {
  flex: none; display: grid; place-items: center; width: 26px; height: 26px;
  border: 0; border-radius: 7px; background: transparent; color: var(--shm-muted); cursor: pointer;
}
.shm-iconbtn:hover { background: var(--shm-surface-strong); color: var(--shm-text); }
.shm-sort { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--shm-surface); border: 1px solid var(--shm-border); }
.shm-sortbtn {
  border: 0; background: transparent; border-radius: 7px; cursor: pointer;
  padding: 6px 11px; color: var(--shm-muted); font-size: 13px; font-weight: 550; white-space: nowrap;
}
.shm-sortbtn:hover { color: var(--shm-text); }
.shm-sortbtn[aria-pressed="true"] { background: var(--dsw-alias-bg-base, #fff); color: var(--shm-text); box-shadow: 0 1px 3px color-mix(in srgb, #000 14%, transparent); }
.shm-sortbtn[title] { cursor: help; }

.shm-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; }
.shm-field { display: flex; align-items: center; gap: 7px; }
.shm-field > label { color: var(--shm-muted); font-size: 12.5px; white-space: nowrap; }
.shm-select, .shm-input {
  height: 34px; border: 1px solid var(--shm-border); border-radius: 8px;
  background: var(--shm-surface); padding: 0 9px; outline: 0; color: var(--shm-text);
}
.shm-select:focus, .shm-input:focus { border-color: var(--shm-accent); box-shadow: 0 0 0 3px var(--shm-accent-soft); }
.shm-select { max-width: 190px; }
.shm-summary { display: flex; align-items: center; gap: 12px; margin: 16px 0 12px; min-height: 24px; }
.shm-count { color: var(--shm-muted); font-size: 12.5px; }
.shm-reset { border: 0; background: transparent; color: var(--shm-accent); cursor: pointer; padding: 2px 4px; font-size: 12.5px; }
.shm-reset:hover { text-decoration: underline; }

.shm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.shm-card {
  display: flex; flex-direction: column; min-height: 230px;
  padding: 16px; border: 1px solid var(--shm-border); border-radius: 14px;
  background: var(--shm-surface);
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.shm-card:hover { border-color: color-mix(in srgb, var(--shm-accent) 45%, var(--shm-border)); transform: translateY(-1px); box-shadow: 0 8px 24px color-mix(in srgb, #000 8%, transparent); }
.shm-card-head { display: flex; align-items: flex-start; gap: 10px; }
.shm-avatar {
  width: 38px; height: 38px; flex: none; border-radius: 10px; object-fit: cover;
  display: grid; place-items: center; overflow: hidden;
  background: var(--shm-accent-soft); color: var(--shm-accent); font-weight: 700; font-size: 15px;
}
.shm-avatar img { width: 100%; height: 100%; object-fit: cover; }
.shm-card-title { min-width: 0; flex: 1; }
.shm-card-name { margin: 0; font-size: 15px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shm-card-sub { margin: 2px 0 0; color: var(--shm-muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shm-card-desc {
  margin: 11px 0 0; color: var(--shm-muted); font-size: 12.8px; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.shm-card-meta { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 12px; color: var(--shm-muted); font-size: 12px; }
.shm-card-meta span { display: inline-flex; align-items: center; gap: 4px; }
.shm-card-foot { display: flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 14px; flex-wrap: wrap; }
.shm-spacer { flex: 1; }
.shm-badges { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
.shm-badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px;
  border-radius: 999px; font-size: 11px; line-height: 18px; font-weight: 550;
  background: var(--shm-surface-strong); color: var(--shm-muted); white-space: nowrap;
}
.shm-badge-blue { color: var(--shm-accent); background: var(--shm-accent-soft); }
.shm-badge-green { color: var(--shm-success); background: color-mix(in srgb, var(--shm-success) 12%, transparent); }
.shm-badge-warn { color: var(--shm-warn); background: color-mix(in srgb, var(--shm-warn) 13%, transparent); }
.shm-badge-danger { color: var(--shm-danger); background: color-mix(in srgb, var(--shm-danger) 12%, transparent); }

.shm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 30px; padding: 0 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--shm-border); background: var(--dsw-alias-bg-base, #fff);
  color: var(--shm-text); font-size: 12.5px; font-weight: 550; white-space: nowrap;
  transition: background .15s, border-color .15s, opacity .15s;
}
.shm-btn:hover:not(:disabled) { background: var(--shm-surface-strong); border-color: color-mix(in srgb, var(--shm-accent) 35%, var(--shm-border)); }
.shm-btn:disabled { opacity: .55; cursor: not-allowed; }
.shm-btn-primary { border-color: transparent; color: var(--dsw-alias-label-primary-inverted, #fff); background: var(--shm-accent); }
.shm-btn-primary:hover:not(:disabled) { background: var(--dsw-static-blue-600, #2563eb); border-color: transparent; }
.shm-btn-soft { border-color: transparent; background: var(--shm-accent-soft); color: var(--shm-accent); }
.shm-btn-ghost { border-color: transparent; background: transparent; color: var(--shm-muted); }
.shm-btn-danger { color: var(--shm-danger); border-color: color-mix(in srgb, var(--shm-danger) 40%, transparent); }
.shm-btn-lg { height: 36px; padding: 0 15px; font-size: 13.5px; }
.shm-btn[aria-busy="true"] { cursor: progress; }

.shm-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
  border-top-color: currentColor; animation: shm-spin .7s linear infinite;
}
@keyframes shm-spin { to { transform: rotate(360deg); } }
.shm-loading, .shm-empty, .shm-error {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 56px 24px; text-align: center; color: var(--shm-muted);
}
.shm-loading-title { display: flex; align-items: center; gap: 9px; color: var(--shm-text); font-weight: 550; }
.shm-empty-icon, .shm-error-icon {
  width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center;
  background: var(--shm-surface-strong); color: var(--shm-muted);
}
.shm-error-icon { color: var(--shm-danger); background: color-mix(in srgb, var(--shm-danger) 10%, transparent); }
.shm-empty h3, .shm-error h3 { margin: 2px 0 0; color: var(--shm-text); font-size: 15px; }
.shm-empty p, .shm-error p { margin: 0; max-width: 460px; font-size: 13px; }
.shm-inline-error {
  display: flex; gap: 8px; align-items: flex-start; padding: 9px 12px; margin: 0 0 12px;
  border-radius: 9px; font-size: 12.5px;
  color: var(--shm-danger); background: color-mix(in srgb, var(--shm-danger) 9%, transparent);
}
.shm-skeletons { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.shm-skeleton { height: 230px; border-radius: 14px; border: 1px solid var(--shm-border); background: linear-gradient(100deg, var(--shm-surface) 30%, var(--shm-surface-strong) 50%, var(--shm-surface) 70%); background-size: 220% 100%; animation: shm-shimmer 1.4s ease-in-out infinite; }
@keyframes shm-shimmer { from { background-position: 120% 0; } to { background-position: -120% 0; } }

.shm-pagination { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.shm-page-info { color: var(--shm-muted); font-size: 12.5px; min-width: 120px; text-align: center; }

.shm-overlay {
  position: fixed; inset: 0; z-index: 80;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: var(--dsw-alias-bg-mask-1, rgba(15, 23, 42, .45));
  backdrop-filter: var(--dsw-mask-blur, none);
  animation: shm-fade .15s ease-out;
}
@keyframes shm-fade { from { opacity: 0; } to { opacity: 1; } }
.shm-modal {
  display: flex; flex-direction: column; width: min(760px, 100%); max-height: min(86vh, 900px);
  border-radius: 16px; border: 1px solid var(--shm-border);
  background: var(--dsw-alias-bg-base, #fff); color: var(--shm-text);
  box-shadow: 0 24px 70px color-mix(in srgb, #000 32%, transparent);
  animation: shm-pop .18s ease-out;
}
.shm-modal-wide { width: min(920px, 100%); }
.shm-modal-sm { width: min(440px, 100%); }
@keyframes shm-pop { from { transform: translateY(6px) scale(.985); opacity: 0; } to { transform: none; opacity: 1; } }
.shm-modal-head { display: flex; align-items: flex-start; gap: 12px; padding: 18px 20px 14px; border-bottom: 1px solid var(--shm-border); }
.shm-modal-title { margin: 0; font-size: 16px; font-weight: 650; min-width: 0; overflow-wrap: anywhere; }
.shm-modal-sub { margin: 3px 0 0; color: var(--shm-muted); font-size: 12px; overflow-wrap: anywhere; }
.shm-modal-body { flex: 1; min-height: 0; overflow: auto; padding: 18px 20px; }
.shm-modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 13px 20px; border-top: 1px solid var(--shm-border); flex-wrap: wrap; }
.shm-kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px 16px; margin: 0; }
.shm-kv > div { min-width: 0; }
.shm-kv dt { color: var(--shm-muted); font-size: 11.5px; margin: 0 0 2px; }
.shm-kv dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
.shm-section { margin-top: 18px; }
.shm-section:first-child { margin-top: 0; }
.shm-section-title { margin: 0 0 8px; font-size: 13px; font-weight: 650; }
.shm-overview { margin: 0; color: var(--shm-muted); font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
.shm-taglist { display: flex; flex-wrap: wrap; gap: 5px; }
.shm-warnbox {
  display: flex; gap: 8px; padding: 9px 11px; border-radius: 9px; margin-bottom: 12px;
  color: var(--shm-warn); background: color-mix(in srgb, var(--shm-warn) 10%, transparent); font-size: 12.5px;
}

.shm-dl-head { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.shm-dl-path { color: var(--shm-muted); font-size: 12px; overflow-wrap: anywhere; }
.shm-dl-path code { background: var(--shm-surface-strong); padding: 1px 5px; border-radius: 5px; }
.shm-dl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.shm-dl-card { display: flex; flex-direction: column; padding: 15px; border: 1px solid var(--shm-border); border-radius: 13px; background: var(--shm-surface); }
.shm-dl-card-head { display: flex; gap: 10px; align-items: flex-start; }
.shm-dl-name { margin: 0; font-size: 14.5px; font-weight: 650; overflow-wrap: anywhere; }
.shm-dl-slug { margin: 2px 0 0; color: var(--shm-muted); font-size: 11.5px; overflow-wrap: anywhere; }
.shm-dl-desc { margin: 10px 0 0; color: var(--shm-muted); font-size: 12.5px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.shm-dl-note { margin: 9px 0 0; padding: 7px 9px; border-left: 2px solid var(--shm-accent); background: var(--shm-accent-soft); border-radius: 0 7px 7px 0; font-size: 12.5px; overflow-wrap: anywhere; }
.shm-dl-foot { display: flex; gap: 7px; align-items: center; margin-top: auto; padding-top: 12px; flex-wrap: wrap; }
.shm-editor { display: grid; gap: 12px; }
.shm-editor .shm-input { width: 100%; height: 36px; }
.shm-editor textarea.shm-input { height: 84px; padding: 8px 9px; resize: vertical; line-height: 1.5; }
.shm-field-block > label { display: block; margin-bottom: 5px; font-size: 12.5px; font-weight: 550; }
.shm-hint { margin: 4px 0 0; color: var(--shm-muted); font-size: 11.5px; }
.shm-editor-actions { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.shm-saved { color: var(--shm-success); font-size: 12px; }

.shm-md { font-size: 13.5px; line-height: 1.75; overflow-wrap: anywhere; }
.shm-md > :first-child { margin-top: 0; }
.shm-md > :last-child { margin-bottom: 0; }
.shm-md h1, .shm-md h2, .shm-md h3, .shm-md h4, .shm-md h5, .shm-md h6 { margin: 1.35em 0 .55em; line-height: 1.35; font-weight: 650; }
.shm-md h1 { font-size: 21px; } .shm-md h2 { font-size: 18px; } .shm-md h3 { font-size: 16px; }
.shm-md h4, .shm-md h5, .shm-md h6 { font-size: 14px; }
.shm-md p { margin: .7em 0; }
.shm-md ul, .shm-md ol { margin: .7em 0; padding-left: 1.6em; }
.shm-md li { margin: .22em 0; }
.shm-md li > p { margin: .2em 0; }
.shm-md code { padding: .12em .35em; border-radius: 5px; background: var(--shm-surface-strong); font-size: .9em; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.shm-md pre { margin: .9em 0; padding: 12px 14px; border-radius: 9px; overflow: auto; background: var(--shm-surface-strong); border: 1px solid var(--shm-border); }
.shm-md pre code { padding: 0; background: transparent; font-size: 12.5px; line-height: 1.6; }
.shm-md blockquote { margin: .9em 0; padding: .1em 0 .1em 12px; border-left: 3px solid var(--shm-border); color: var(--shm-muted); }
.shm-md hr { border: 0; border-top: 1px solid var(--shm-border); margin: 1.4em 0; }
.shm-md table { border-collapse: collapse; width: 100%; margin: .9em 0; font-size: 12.8px; }
.shm-md th, .shm-md td { border: 1px solid var(--shm-border); padding: 6px 9px; text-align: left; vertical-align: top; }
.shm-md th { background: var(--shm-surface-strong); font-weight: 600; }
.shm-md a { text-decoration: underline; text-underline-offset: 2px; }

.shm-toast {
  position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 120;
  display: flex; align-items: center; gap: 9px; max-width: min(560px, calc(100% - 32px));
  padding: 9px 13px; border-radius: 10px; font-size: 13px;
  color: var(--dsw-alias-label-primary-inverted, #fff); background: color-mix(in srgb, #111 88%, transparent);
  box-shadow: 0 10px 30px color-mix(in srgb, #000 30%, transparent);
  animation: shm-toast-in .18s ease-out;
}
.shm-toast-success { background: color-mix(in srgb, var(--shm-success) 90%, #000); }
.shm-toast-error { background: color-mix(in srgb, var(--shm-danger) 90%, #000); }
@keyframes shm-toast-in { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
.shm-footer { display: flex; justify-content: center; gap: 6px; padding: 12px 0 0; color: var(--shm-muted); font-size: 11.5px; }

@media (max-width: 720px) {
  .shm-header { padding: 12px 14px 0; gap: 10px; flex-wrap: wrap; }
  .shm-brand { padding-bottom: 10px; }
  .shm-sub { display: none; }
  .shm-tabs { margin-left: 0; width: 100%; }
  .shm-main { padding: 14px 14px 26px; }
  .shm-grid, .shm-dl-grid, .shm-skeletons { grid-template-columns: 1fr; }
  .shm-select { max-width: 150px; }
  .shm-overlay { padding: 10px; }
  .shm-modal { max-height: 92vh; }
  .shm-modal-body { padding: 14px; }
  .shm-modal-head, .shm-modal-foot { padding-left: 14px; padding-right: 14px; }
}
`;

  // project/src/client/page.tsx
  function Page({ api, t }) {
    const [tab, setTab] = import_react5.default.useState("market");
    const [version, setVersion] = import_react5.default.useState(0);
    const [toast, setToast] = import_react5.default.useState(null);
    const timer = import_react5.default.useRef(null);
    const notify = import_react5.default.useCallback((tone, message) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      setToast({ id: Date.now(), tone, message });
      timer.current = window.setTimeout(() => {
        setToast(null);
        timer.current = null;
      }, 4500);
    }, []);
    import_react5.default.useEffect(() => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    }, []);
    return /* @__PURE__ */ import_react5.default.createElement("div", { className: "shm-root", "data-dsh-plugin": "skillhub-market", "data-dsh-skillhub-market-view": "" }, /* @__PURE__ */ import_react5.default.createElement("style", null, styles), /* @__PURE__ */ import_react5.default.createElement("header", { className: "shm-header" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "shm-brand" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "shm-logo" }, /* @__PURE__ */ import_react5.default.createElement(Icon, { name: "layers", size: 21 })), /* @__PURE__ */ import_react5.default.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ import_react5.default.createElement("h1", { className: "shm-title" }, t("title")), /* @__PURE__ */ import_react5.default.createElement("p", { className: "shm-sub" }, t("subtitle")))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "shm-tabs", role: "tablist", "aria-label": t("title") }, /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        type: "button",
        role: "tab",
        className: "shm-tab",
        "aria-selected": tab === "market",
        onClick: () => setTab("market")
      },
      t("tab.market")
    ), /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        type: "button",
        role: "tab",
        className: "shm-tab",
        "aria-selected": tab === "downloaded",
        onClick: () => setTab("downloaded")
      },
      t("tab.downloaded"),
      version > 0 ? /* @__PURE__ */ import_react5.default.createElement("span", { className: "shm-tab-count" }, version) : null
    ))), /* @__PURE__ */ import_react5.default.createElement("main", { className: "shm-main" }, /* @__PURE__ */ import_react5.default.createElement("div", { hidden: tab !== "market" }, /* @__PURE__ */ import_react5.default.createElement(MarketTab, { api, t, notify, onInstalled: () => setVersion((value) => value + 1) })), /* @__PURE__ */ import_react5.default.createElement("div", { hidden: tab !== "downloaded" }, /* @__PURE__ */ import_react5.default.createElement(DownloadedTab, { api, t, notify, version, onGoMarket: () => setTab("market") }))), toast === null ? null : /* @__PURE__ */ import_react5.default.createElement(Toast, { key: toast.id, message: toast.message, tone: toast.tone }));
  }

  // project/src/client/index.tsx
  var PANEL_ID = "skillhub-market";
  var NS = "skillhub-market";
  function PanelIcon({ size = 18 }) {
    return /* @__PURE__ */ import_react6.default.createElement("span", { "data-dsh-panel-entry": PANEL_ID, style: { display: "grid", placeItems: "center", width: "100%", height: "100%" } }, /* @__PURE__ */ import_react6.default.createElement(Icon, { name: "layers", size }));
  }
  function apply(ctx) {
    const disposers = [];
    const warn = (message) => {
      ctx.logger?.warn?.(message);
    };
    let translate = makeTranslator((key) => zh[key] ?? key);
    const locale = ctx.locale;
    if (locale !== void 0) {
      const register = () => {
        try {
          return locale.register(NS, { zh, en });
        } catch (error) {
          warn(`skillhub-market: \u6CE8\u518C\u8BED\u8A00\u5305\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
          return () => {
          };
        }
      };
      if (typeof ctx.effect === "function") ctx.effect(register, "skillhub-market: dictionaries");
      else disposers.push(register());
      try {
        const bound = locale.bind(NS);
        translate = makeTranslator(bound);
      } catch {
      }
    }
    const slots = ctx.slots;
    if (slots === void 0) {
      warn("skillhub-market: \u5F53\u524D\u5BBF\u4E3B\u672A\u63D0\u4F9B slots\uFF0C\u9762\u677F\u672A\u6CE8\u518C");
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
        }
      }
      return;
    }
    const api = new SkillhubApi();
    const registerSidebar = () => {
      try {
        return slots.inject("sidebar.panellist", () => slots.register({
          name: "sidebar.panellist",
          id: PANEL_ID,
          order: 40,
          label: () => translate("entry.label")
        }, PanelIcon));
      } catch (error) {
        warn(`skillhub-market: \u6CE8\u518C\u4FA7\u8FB9\u680F\u5165\u53E3\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
        return () => {
        };
      }
    };
    const registerPage = () => {
      try {
        return slots.inject("main", () => slots.register({
          name: "main",
          key: PANEL_ID,
          inject: () => ({ api, t: translate })
        }, Page));
      } catch (error) {
        warn(`skillhub-market: \u6CE8\u518C\u4E3B\u9762\u677F\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
        return () => {
        };
      }
    };
    if (typeof ctx.effect === "function") {
      ctx.effect(registerSidebar, "skillhub-market: sidebar entry");
      ctx.effect(registerPage, "skillhub-market: main panel");
    } else {
      disposers.push(registerSidebar(), registerPage());
    }
    void disposers;
  }
  var inject = ["slots", "locale", "layout"];
  return __toCommonJS(client_exports);
})();

return __skillhubMarket;
  },
});
