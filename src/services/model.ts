import type { ModelConfig } from '@/types'

const STORAGE_KEY = 'model_configs'
const ACTIVE_KEY = 'model_active_id'

/** 读取所有模型配置 */
export function loadModelConfigs(): ModelConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ModelConfig[]) : []
  } catch {
    return []
  }
}

/** 保存所有模型配置 */
export function saveModelConfigs(configs: ModelConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

/** 获取当前激活的模型配置 */
export function getActiveModelConfig(): ModelConfig | null {
  const configs = loadModelConfigs()
  const activeId = localStorage.getItem(ACTIVE_KEY)
  const active = configs.find((c) => c.id === activeId) ?? configs.find((c) => c.active) ?? null
  return active
}

/** 设置某个模型为激活（其余取消激活） */
export function setActiveModel(id: string): ModelConfig | null {
  const configs = loadModelConfigs()
  let found: ModelConfig | null = null
  const updated = configs.map((c) => {
    if (c.id === id) {
      found = { ...c, active: true }
      return found
    }
    return { ...c, active: false }
  })
  saveModelConfigs(updated)
  localStorage.setItem(ACTIVE_KEY, id)
  return found
}

/** 添加模型配置 */
export function addModelConfig(config: Omit<ModelConfig, 'id' | 'createdAt'>): ModelConfig {
  const configs = loadModelConfigs()
  const newConfig: ModelConfig = {
    ...config,
    id: `model_${Date.now()}`,
    createdAt: Date.now(),
  }
  configs.push(newConfig)
  saveModelConfigs(configs)
  return newConfig
}

/** 更新模型配置 */
export function updateModelConfig(id: string, updates: Partial<ModelConfig>): void {
  const configs = loadModelConfigs()
  const updated = configs.map((c) => (c.id === id ? { ...c, ...updates } : c))
  saveModelConfigs(updated)
}

/** 删除模型配置 */
export function deleteModelConfig(id: string): void {
  let configs = loadModelConfigs()
  configs = configs.filter((c) => c.id !== id)
  saveModelConfigs(configs)
  if (localStorage.getItem(ACTIVE_KEY) === id) {
    localStorage.removeItem(ACTIVE_KEY)
  }
}
