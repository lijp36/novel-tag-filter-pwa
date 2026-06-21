/** 标签 */
export interface Tag {
  /** 标签名称（BE/HE/互攻/穿越...） */
  name: string
  /** 来源：AI 提取 或 手动添加 */
  source: 'ai' | 'manual'
  /** AI 置信度（0~1），手动标签为 1 */
  confidence: number
}

/** 小说 */
export interface Novel {
  /** 唯一标识（fileName::fileSize 天然去重键） */
  id: string
  /** 文件名 */
  fileName: string
  /** 文件大小（字节） */
  fileSize: number
  /** 内容摘要（头 3000 字 + 尾 1000 字，用于 AI 提取和预览） */
  contentSummary: string
  /** 标签列表 */
  tags: Tag[]
  /** 反规范化标签名称数组，供 Dexie 多值索引查询 */
  tagNames: string[]
  /** 导入时间戳 */
  importTime: number
  /** 最后更新时间戳 */
  updateTime: number
}

/** AI 服务配置 */
export interface AIServiceConfig {
  /** API 基础地址 */
  baseURL: string
  /** API Key */
  apiKey: string
  /** 模型名称 */
  model: string
}

/** AI 标签提取请求 */
export interface AIExtractRequest {
  /** 小说内容摘要 */
  content: string
  /** 已有标签（可选） */
  existingTags?: Tag[]
}

/** AI 标签提取响应 */
export interface AIExtractResponse {
  /** 提取到的标签 */
  tags: Tag[]
}

/** 标签定义（标签库中的一条） */
export interface TagDef {
  id: string
  /** 标签名称 */
  name: string
  /** 用户自定义描述，用于 AI 提示词 */
  description: string
  /** 关键词，辅助判断（可空） */
  keywords: string[]
  /** 是否参与 AI 提取 */
  enabled: boolean
  /** 排序 */
  order: number
}

/** 模型配置 */
export interface ModelConfig {
  id: string
  /** 用户自定义名称 */
  name: string
  /** API 基础地址 */
  baseURL: string
  /** API Key */
  apiKey: string
  /** 模型名称 */
  model: string
  /** 是否当前选中的模型 */
  active: boolean
  /** 创建时间 */
  createdAt: number
}
