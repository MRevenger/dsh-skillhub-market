# Skillhub 技能市场

DeepSeek Harness（DSH）的 Skillhub 市场插件：在线搜索、筛选和安装 Skillhub 技能，并管理 `$DSH_HOME/skills` 下已下载技能的简介、`SKILL.md` 正文、自定义显示名和备注。

## 功能

- 市场列表：关键词搜索（350 ms 防抖）、分页、加载/空/错误/重试状态。
- 排序：全部、近期飙升、下载量、最近上新。
- 筛选：来源、场景分类、API Key；无任何时间范围筛选。
- 技能卡片：名称、简介、来源/分类、下载量/Star、API Key 标记、更新时间、详情、GitHub（不可用时回退 Skillhub 详情页）、下载。
- 下载安装：安全解压到 `$DSH_HOME/skills/<slug>/`，已存在时先询问是否覆盖。
- 已下载：扫描技能目录，解析 YAML frontmatter + Markdown 正文，支持查看详情、打开本地目录、打开 GitHub。
- 自定义元数据：显示名和备注保存在 `$DSH_HOME/skillhub-custom.json`，**不会写回 `SKILL.md` 的 `name`**；重装同一 slug 时保留。

## 安装

### 前置要求

- DeepSeek Harness `>= 0.2.2-rc.1`
- Node.js `>= 22`（推荐 24）
- Git
- 一个 DSH profile（下面以 `desktop` 为例；请替换成你的 profile 名）

仓库根目录就是插件包根目录，`package.json`、`cordis.patch.yml`、`lib/` 都在这里。

### 从源码 clone、构建、安装

```bash
git clone https://github.com/MRevenger/dsh-skillhub-market.git
cd dsh-skillhub-market

# 安装构建依赖。--omit=peer 跳过 DSH/React 等由宿主提供的 peer 依赖。
npm ci --omit=peer

# 类型检查 + 构建 + 测试（可选，但推荐）
npm run typecheck
npm run build
npm test
```

构建产物：

- `lib/index.js`：DSH host 入口（ESM）
- `lib/client.js`：浏览器 `window.__ModuleLoader__` 工厂

安装方式任选一种：

**方式 A：DSH 插件管理器（推荐，已验证）**

打开 DSH 的插件管理界面，选择“安装本地 bundle”，指向 clone 下来的
`dsh-skillhub-market` 目录。插件管理器会读取 `package.json` 的
`dsh.bundle.patch` 和 `dsh.client`，把 `@local/dsh-skillhub-market` 加入
profile 的 bundle 列表并应用补丁。

**方式 B：DSH CLI**

```bash
dsh plugin --profile desktop add github:MRevenger/dsh-skillhub-market#v1.1.0
```

该命令会把 GitHub 仓库作为依赖安装到 profile。若安装后未自动加入 bundle
列表，在 profile 的 `dsh.profile.bundles` 中加入
`@local/dsh-skillhub-market`，或在插件管理器中启用它。

**方式 C：Release 压缩包**

1. 从 [Releases](https://github.com/MRevenger/dsh-skillhub-market/releases)
   下载 `dsh-skillhub-market-v1.1.0.zip`。
2. 解压得到 `dsh-skillhub-market/` 目录。
3. 用方式 A 选择该目录，或执行：

```bash
dsh plugin --profile desktop add /absolute/path/to/dsh-skillhub-market
```

安装完成后：

- 重启 DSH，或刷新 Web GUI；
- 侧边栏出现“Skillhub 技能市场”；
- 若没有出现，检查插件管理器中 `@local/dsh-skillhub-market` 是否 enabled。

## 开发

```bash
npm ci --omit=peer
npm run typecheck
npm run build
npm test
```

- 构建使用 `esbuild-wasm` 的浏览器构建 API + 虚拟文件系统插件，不依赖原生
  esbuild 二进制；这在 Windows/DSH 沙箱下也能工作。
- 测试使用 Node 24 的 TypeScript 类型剥离；Node 测试运行器默认按文件起子进程
  会触发 `spawn EPERM`，脚本已加 `--test-isolation=none`。
- 本地开发时，`npm run build` 后刷新 GUI 即可加载新的 `lib/client.js`；host
  入口变更需要重启 DSH。

## 发布

推送 `v*` tag 会触发
[`.github/workflows/release.yml`](.github/workflows/release.yml)：

1. `npm ci --omit=peer`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. 打包 `dsh-skillhub-market-<tag>.zip` 和 `.sha256`
6. 创建 GitHub Release 并上传资产

也可以在 Actions 页面手动触发 `Build and Release`，填入已存在的 tag。
Release 资产是完整可安装的 bundle，不包含 `node_modules` 和源码构建缓存。

## Skillhub API 与参数映射

所有映射集中在 `src/host/api-map.ts`。

| 用途 | 端点 |
| --- | --- |
| 列表/搜索 | `GET https://api.skillhub.cn/api/skills` |
| 分类 | `GET https://api.skillhub.cn/api/v1/categories` |
| 详情 | `GET https://api.skillhub.cn/api/v1/skills/{slug}` |
| 下载 | `GET https://api.skillhub.cn/api/v1/download?slug={slug}` |
| 站点详情页 | `https://skillhub.cn/skills/{slug}` |

列表参数：`page`、`pageSize`（≤100）、`keyword`、`sortBy`、`order`、`category`、`source`、`labels`。

### 排序

| UI | 请求参数 | 说明 |
| --- | --- | --- |
| 全部 | 不传 `sortBy`/`order` | API 默认综合排序 |
| 近期飙升 | `sortBy=score&order=desc` | API **不支持** `trending`（会返回 400：`sortBy 不支持（updated_at/downloads/stars/installs/score）`），故集中回退到 `score`。站点自身也是 trending→score。 |
| 下载量 | `sortBy=downloads&order=desc` | |
| 最近上新 | `sortBy=updated_at&order=desc` | |

### 筛选

- **来源**：`all` 不传；`community` / `clawhub` / `enterprise` 映射为 `source=<value>`。注意该参数是列表流筛选，返回项中仍可能混有其他来源；卡片按站点规则展示实际来源（`clawhub` 且已认领时显示为 `community`）。
- **场景分类**：`category=<key>`，选项来自 `/api/v1/categories`；网络失败时使用内置的 13 个实时分类回退。
- **API Key**：`labels=requires_api_key:true` 或 `labels=requires_api_key:false`。
- 无时间范围参数。

## 下载与安装

1. 校验 slug（`^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$`，且不能以点结尾）。
2. 目标已存在且未确认覆盖 → 返回 409 `ALREADY_EXISTS`，UI 弹出确认框；确认后带 `overwrite: true` 重试。
3. 下载 ZIP（120 s 超时、32 MB 上限），校验 `PK\x03\x04` 头。
4. 在 `$DSH_HOME/skills/.skillhub-tmp-*` 中安全解压：
   - 拒绝绝对路径、盘符、`..`、空路径段、NUL、超长路径；
   - 拒绝 ZIP64、加密 ZIP、非 stored/deflate、符号链接、重复路径、超大条目/总量；
   - 校验 CRC 与声明大小；
   - 要求根目录或单一顶层目录下存在 `SKILL.md`，否则判定无效。
5. 解压成功后原子替换目标目录；失败时恢复旧目录并清理临时目录。
6. 记录 `downloadedAt`/`sourceHomepage`，刷新已下载列表。

安全上限：500 个条目、单文件 16 MB、解压总量 64 MB。

## 自定义元数据

位置：`$DSH_HOME/skillhub-custom.json`（`$DSH_HOME` 优先取插件配置 `dshHome`，否则取 `DSH_HOME`，最后回退 `~/.dsh`）。

```json
{
  "pdf-skill": {
    "slug": "pdf-skill",
    "displayName": "我的 PDF 助手",
    "note": "每周报表处理专用",
    "downloadedAt": "2026-11-07T...",
    "sourceHomepage": "https://github.com/..."
  }
}
```

- 列表主显示名优先级：`displayName` > frontmatter `name` > 目录名。
- 输入框失焦或点击“保存”都会持久化；写入采用临时文件 + rename。
- 元数据文件损坏时返回错误提示并禁止覆盖，避免丢失用户数据。
- 重装同一 slug 时保留 `displayName`、`note`。
- **只写 JSON，不改 `SKILL.md` 的 `name`。**

## 安全说明

插件不会执行下载技能包中的任何代码，只读取 `SKILL.md` 和文件内容。

唯一会被静态扫描标记为 `MEDIUM` 的是“打开本地目录”：host 端使用
`node:child_process` 启动系统文件管理器（Windows `explorer.exe`、macOS `open`、
Linux `xdg-open`）。调用不经过 shell，参数是已校验且限定在
`$DSH_HOME/skills/<dir>` 内的绝对路径，不会拼接用户输入的命令。

## 已知限制

- Skillhub `trending` 排序不存在，只能以 `score` 近似“近期飙升”。
- `source` 是列表流筛选而非严格发布者过滤，结果可能混合来源。
- GitHub 链接来自 `upstream_url`/`sourceUrl`/`githubUrl`/`homepage` 等候选字段，且只接受 `github.com`；没有 GitHub 时回退 `https://skillhub.cn/skills/{slug}`。
- “打开本地目录”使用宿主 `explorer.exe`/`open`/`xdg-open`；若被宿主沙箱限制会提示失败。
- 分类回退列表为 2026-11 的实时值，后续以 `/api/v1/categories` 为准。
- 详情接口字段同时存在 snake_case/camelCase，已做归一化；若 API 新增字段需在 `normalizeSkill` 补充。
