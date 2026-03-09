# 新闻抓取成功率说明与优化建议

## 仍未修复的期刊/站点（35 个失败，基于最新抓取日志）

以下均为 **HTTP 403** 或 **超时**，当前未做 Puppeteer/RSS 兜底：

| 期刊/站点名称 | 域名 | 失败数 | 备注 |
|---------------|------|--------|------|
| **Annual Review** 系列 | annualreviews.org | 5 | Sociology, Nutrition, Public Health, Publ Health, Epidemiology |
| **The Lancet** 系列 | thelancet.com | 5 | 主站、Public Health、Global Health、Infectious、Diabetes |
| **NEJM** | nejm.org | 4 | 主站、Equity、Climate、AI in Medicine |
| **BMJ** 系列 | bmj.com | 3 | 主站、/、news/news |
| **Oxford 期刊** | academic.oup.com | 2 | Toxicological Sciences, IJE |
| **JECH** | jech.bmj.com | 2 | 主站、content/79/4 |
| **Wiley** | onlinelibrary.wiley.com | 2 | Health Economics, Statistics In Medicine |
| American Journal of Public Health | ajph.aphapublications.org | 1 | |
| American Journal of Preventive Medicine | www.ajpmonline.org | 1 | |
| Annals of Internal Medicine | acpjournals.org | 1 | |
| Cell | cell.com | 1 | |
| The Journal of Pediatrics | jpeds.com | 1 | |
| Journal of Adolescent Health | jahonline.org | 1 | |
| Tobacco Control | tobaccocontrol.bmj.com | 1 | |
| Medical Care | journals.lww.com | 1 | |
| Health Affairs | healthaffairs.org | 1 | |
| Occupational and Environmental Medicine | oem.bmj.com | 1 | |
| Hypertension | ahajournals.org | 1 | |
| **Environmental Health Perspectives** | ehp.niehs.nih.gov | 1 | **超时/网络**，非 403 |

**JAMA（3 个）**：已用 Puppeteer 替代，但当前抓取到 **0 条**，说明页面结构或选择器（如 `.card-article`）可能已变，需检查 `fetchNewsWithPuppeteer.ts` 中 JAMA 的 DOM 选择器。

---

## 当前失败来源概览（基于 data/summary.json）

失败较多的**域名**（多为学术/出版社，反爬或需 JS）：

| 域名 | 失败数量 | 说明 |
|------|----------|------|
| thelancet.com | 5 | 柳叶刀系列，常 403/JS |
| bmj.com（含子域） | 4+ | BMJ / Tobacco Control / JECH 等 |
| nejm.org | 4 | NEJM，反爬 |
| annualreviews.org | 4 | 年评，常 403 |
| journals.elsevier.com | 4 | 爱思唯尔 |
| onlinelibrary.wiley.com | 2 | 威利 |
| academic.oup.com | 2 | 牛津期刊 |
| 其余单条 | 各 1 | cell.com, jpeds.com, mdpi.com, healthaffairs.org 等 |

很多站点返回 **403 Forbidden** 或需要 **JavaScript 渲染**，纯 axios 请求易被拦截。

---

## 如何提高成功率

### 1. 用 RSS 兜底（已对 JAMA 使用）

- 代码里已对 `jamanetwork.com` 的 3 个 URL 配置了 `JAMA_RSS_MAP`，请求失败时会用 RSS 替代。
- 建议：为其他有 RSS 的站点同样配置「HTML 失败 → RSS 兜底」，在 `config.ts` 里扩展类似 `JAMA_RSS_MAP` 的映射，并在 `getAllNews.ts` 里用同一套替代逻辑（按 URL 匹配，失败时请求对应 RSS URL 并解析为 `RequestResult`）。

### 2. 调整请求参数（config.ts 的 CONFIGS）

- **requestTimeout**：从 20000 提高到 30000–40000，减少因慢响应导致的超时失败。
- **retries**：从 3 提高到 4–5，给不稳定站点更多重试机会。
- **retryDelay**：可适当加大（如 1500–2000），避免重试太密集触发限流。
- **concurrentLimit**：从 5 降到 3，降低同一时间对单站的请求压力，减少 429/403。

### 3. 使用代理（需自备代理服务）

- 在 `config.ts` 中设置 `useProxy: true` 和 `proxyUrl: 'http://your-proxy:port'`。
- `fetchWithAxios` 已预留代理逻辑，需在 axios 的请求配置里真正传入 `proxy: proxyUrl` 才会生效；若尚未接好，可在 `getAllNews.ts` 的 axios config 里加上 `proxy: mergedOptions.useProxy && mergedOptions.proxyUrl ? { host, port } : undefined`。

### 4. 清理错误缓存，避免长期“假失败”

- 当前逻辑已对 403 不写缓存、不读错误缓存，所以 403 每次都会重试。
- 若曾缓存过大量错误结果，可清空 `.cache` 目录后重跑，让所有源重新请求一次。

### 5. 暂时移除或降级问题源

- 对长期 403/超时且无 RSS 的 URL，可先从 `NEWS_SOURCES` 中注释或删除，先保证整体成功率；待有 RSS 或代理后再加回。

### 6. 看日志里的失败详情

- 每次抓取结束后，控制台会按「域名 + HTTP 状态码」打印失败列表（例如 `thelancet.com (HTTP 403): 5 个`）。
- `data/summary.json` 和归档里的 `summary.json` 已包含 `statusCode`，可据此区分 403、超时等，针对性加 RSS 或调参。

---

## 快速检查失败来源

- 看控制台：抓取结束后会输出「❌ 失败的来源」及每个域名下的 URL 列表。
- 看文件：`data/summary.json` 中 `status === "error"` 的条目，其 `statusCode` 表示 HTTP 状态（无响应时为 `null`，多为超时/网络问题）。
