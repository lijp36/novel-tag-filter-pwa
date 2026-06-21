# Novel Tag Filter PWA

手机本地小说标签筛选工具——AI 自动提取 BE/HE/互攻/虐文等标签，数据全程本地处理，隐私友好。

## 核心需求

- 手机端批量导入本地 TXT 小说文件夹
- AI 自动识别剧情标签（BE/HE/互攻/穿越/重生/虐文/甜宠等）
- 按标签筛选、搜索小说，快速找到想看的类型
- 不必逐个打开文件翻找标签

## 技术栈

| 类别 | 选型 | 说明 |
|------|------|------|
| 前端框架 | React 19 + TypeScript | 类型安全，生态成熟 |
| 构建工具 | Vite 8 | 开发体验好，构建快 |
| UI 组件库 | Ant Design Mobile 5 | React 原生、移动端优先、中文社区活跃 |
| PWA | vite-plugin-pwa | 添加到桌面、离线缓存、Service Worker 自动更新 |
| 本地存储 | IndexedDB (Dexie.js 4) | 持久化小说元信息和标签，reactive 查询 |
| 路由 | React Router 7 | SPA 模式，createBrowserRouter |
| AI 标签提取 | OpenAI 兼容接口 | 支持 GLM-4 / DeepSeek V3 等模型，前端通用 |

## 文件读取方案（双策略）

> **核心约束**：File System Access API 在 iOS Safari 上完全不可用，不能作为唯一方案。

### 主方案：批量文件选择（全平台通用）

- `<input type="file" multiple accept=".txt">` 批量选择文件
- 所有浏览器均支持，包括 iOS Safari
- 兼容性最广，作为兜底和主力

### 增强方案：文件夹选择（Android Chrome 等）

- 检测 `showDirectoryPicker` 是否可用
- 可用时提供"选择整个文件夹"快捷入口
- 不可用时自动降级到主方案

### 数据持久化

- 使用 IndexedDB（Dexie.js）存储已导入的文件内容和标签
- 授权丢失或浏览器重启后无需重新读取
- 大文件只存元信息 + 内容摘要，按需读取全文

## AI 标签提取

### 模型选择（按需切换）

| 模型 | 优势 | 说明 |
|------|------|------|
| DeepSeek V3 | 价格极低，中文能力强，API 兼容 OpenAI 格式 | 推荐首选 |
| GLM-4 / GLM-Flash | 国内接口稳定，小额免费额度 | 备选 |
| 其他 OpenAI 兼容接口 | 切换模型只改 base URL 和 key | 架构通用 |

### 提取策略

- **不全量传文**：只截取前 2000~3000 字（开头 + 部分中间段落）传给模型
- **Few-shot 提示词**：提供标签提取示例，提高准确率
- **结果缓存**：AI 提取的标签持久化到 IndexedDB，一次提取永久可用
- **手动补充**：支持用户手动添加/修改/删除标签

### 联网与离线分层

- **离线可用**：文件浏览、手动标签、已提取标签的筛选和搜索
- **需要联网**：AI 标签提取（一次性操作，结果缓存到本地）

## 数据模型

```typescript
// 小说
interface Novel {
  id: string              // 唯一标识（fileName::fileSize 天然去重键）
  fileName: string        // 文件名
  fileSize: number        // 文件大小（字节）
  contentSummary: string  // 内容摘要（前2000字）
  tags: Tag[]             // 标签列表
  tagNames: string[]      // 反规范化标签名称数组，供 Dexie 多值索引查询
  importTime: number      // 导入时间戳
  updateTime: number      // 最后更新时间戳
}

// 标签
interface Tag {
  name: string            // 标签名称（BE/HE/互攻/穿越...）
  source: "ai" | "manual" // 来源：AI提取 或 手动添加
  confidence: number      // AI置信度（0~1），手动标签为1
}

// AI 服务配置
interface AIServiceConfig {
  baseURL: string         // API 基础地址
  apiKey: string          // API Key
  model: string           // 模型名称
}
```

> **设计说明**：`tagNames` 是关键反规范化字段。Dexie 的多值索引 `*tags` 对对象数组无效（会索引 `[object Object]`），因此用 `string[]` 类型的 `*tagNames` 做多值索引，支持按标签名高效查询。

## 功能模块

### 1. 文件导入

- 批量选择 TXT 文件 / 选择整个文件夹（增强）
- 导入进度展示
- 重复文件检测（按文件名 + 大小去重，ID = `fileName::fileSize`）

### 2. AI 标签提取

- 一键批量提取（选择未标注的小说）
- 单本提取
- 提取进度展示
- 提取结果可编辑（修改/删除/新增标签）
- 手动标签在 AI 重新提取时会被保留

### 3. 标签筛选

- 标签云展示（热门标签高亮）
- 多标签组合筛选（AND / OR）
- 排除标签（如"排除BE"）

### 4. 搜索

- 按文件名搜索
- 按标签搜索
- 按内容摘要搜索

### 5. 小说详情

- 文件基本信息展示
- 标签列表（可编辑）
- 内容摘要预览
- 全文阅读（按需加载）

## 项目结构

```
novel-tag-filter-pwa/
├── public/
│   ├── pwa-192x192.svg       # PWA 图标 192x192
│   ├── pwa-512x512.svg       # PWA 图标 512x512
│   └── vite.svg               # 网站图标
├── src/
│   ├── components/            # UI 组件（占位，待功能迭代）
│   │   ├── FileImport/        #   文件导入组件
│   │   ├── TagFilter/         #   标签筛选组件
│   │   ├── NovelList/         #   小说列表组件
│   │   ├── NovelDetail/       #   小说详情组件
│   │   └── AITagger/          #   AI 标签提取组件
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useFileReader.ts   #   文件读取：批量导入、进度跟踪、写入 IndexedDB
│   │   └── useAITagger.ts     #   AI 标签：单本/批量提取、进度跟踪、结果缓存
│   ├── db/                    # IndexedDB 数据层
│   │   └── index.ts           #   Dexie 数据库定义（NovelTagFilterDB）
│   ├── services/              # 服务层
│   │   ├── ai.ts              #   AI 接口封装（OpenAI 兼容，含 Few-shot 提示词）
│   │   └── file.ts            #   文件处理（读取、摘要提取、ID 生成、目录选择器检测）
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts           #   Novel、Tag、AIServiceConfig 等接口
│   ├── pages/                 # 页面
│   │   ├── Home/index.tsx     #   首页：搜索栏 + 标签筛选 + 小说列表（useLiveQuery 实时响应）
│   │   ├── Import/index.tsx   #   导入页：文件选择 + 目录选择（增强）+ 进度条
│   │   └── Detail/index.tsx   #   详情页：文件信息 + 标签 + 内容摘要
│   ├── App.tsx                # App Shell：TabBar 布局 + SafeArea 刘海适配
│   ├── main.tsx               # 入口：路由配置 + PWA Service Worker 注册
│   ├── index.css              # 全局样式：reset、中文字体栈、safe-area padding
│   └── vite-env.d.ts          # Vite + PWA 类型声明
├── index.html                 # HTML 入口（zh-CN、viewport-fit=cover）
├── vite.config.ts             # Vite 配置：React + PWA + @/* 路径别名
├── tsconfig.json              # TypeScript 根配置（references 分包）
├── tsconfig.app.json          # 应用 TS 配置（strict、路径别名）
├── tsconfig.node.json         # Node TS 配置（vite.config.ts 专用）
└── package.json
```

## 关键实现细节

### 路径别名

`@/*` 映射到 `src/*`，在 `vite.config.ts` 和 `tsconfig.app.json` 中同步配置：

```typescript
// vite.config.ts
resolve: {
  alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
}

// tsconfig.app.json
{ "baseUrl": ".", "paths": { "@/*": ["src/*"] } }
```

### PWA 配置

- `registerType: 'autoUpdate'`：Service Worker 自动更新，无需用户手动刷新
- `display: 'standalone'`：隐藏浏览器 UI，类原生应用体验
- AI API 端点使用 `NetworkOnly` 策略：不缓存 AI 响应
- 静态资源使用默认预缓存策略：离线可访问

### Dexie 索引设计

```typescript
novels: 'id, fileName, importTime, *tagNames'
```

| 索引 | 用途 |
|------|------|
| `id` | 主键，天然去重（fileName::fileSize） |
| `fileName` | 按文件名查询/去重 |
| `importTime` | 按导入时间排序 |
| `*tagNames` | 多值索引，支持按标签名高效筛选 |

### 移动端适配

- `viewport-fit=cover`：刘海屏安全区域支持
- `SafeArea` 组件：antd-mobile 顶部/底部安全区适配
- `100dvh`：动态视口高度，避免移动浏览器地址栏影响布局
- `env(safe-area-inset-*)`：CSS 环境变量适配

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:5173
```

### 生产构建

```bash
npm run build
npm run preview   # 预览构建结果
```

### 类型检查

```bash
npx tsc -b
```

## 可行性评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术可行性 | ⭐⭐⭐⭐ | 完全可行，注意 iOS 文件访问限制 |
| 开发难度 | ⭐⭐⭐ | 中等，核心难点在文件读取和 AI 集成 |
| 实用性 | ⭐⭐⭐⭐⭐ | 痛点真实，移动端确缺这类工具 |
| 隐私友好 | ⭐⭐⭐⭐⭐ | 全本地 + 可选 AI，数据不上传 |

## 当前状态

- [x] 项目脚手架搭建（React 19 + Vite 8 + TypeScript）
- [x] PWA 配置（manifest + Service Worker + 离线缓存）
- [x] IndexedDB 数据库层（Dexie.js + useLiveQuery 实时响应）
- [x] 文件导入功能（批量文件选择 + 目录选择器增强）
- [x] AI 标签提取服务层（OpenAI 兼容接口 + Few-shot 提示词）
- [x] 三页 App Shell（首页 / 导入 / 详情 + TabBar 导航）
- [ ] 标签筛选组件（标签云 + AND/OR 组合 + 排除标签）
- [ ] AI 标签提取 UI（配置 API Key / 批量提取 / 结果编辑）
- [ ] 搜索功能（文件名 + 标签 + 内容摘要）
- [ ] 小说详情完善（标签编辑 + 全文阅读）
- [ ] 正式 PWA 图标（替换 SVG 占位）
- [ ] 标签模板系统
- [ ] 导出/导入标签数据
- [ ] 阅读进度记录
- [ ] 小说分类收藏夹

## 后续扩展

- Web Worker 本地小模型做离线标签提取
- 标签模板系统（不同类型小说使用不同标签集）
- 导出/导入标签数据（JSON 格式，换设备迁移）
- 阅读进度记录
- 小说分类收藏夹
