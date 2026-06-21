import type { Novel, Tag } from '@/types'

/** 内容摘要：开头最大字数 */
const HEAD_LENGTH = 3000
/** 内容摘要：结尾最大字数 */
const TAIL_LENGTH = 1000

/** 编码检测：用前 512 字节采样判断编码 */
function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer, 0, Math.min(512, buffer.byteLength))

  // UTF-8 BOM: EF BB BF
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8'
  }

  // 尝试用 UTF-8 解码采样，如果不是合法 UTF-8 则判定为 GBK
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    decoder.decode(bytes)
    return 'utf-8'
  } catch {
    return 'gbk'
  }
}

/** 读取文本文件，自动检测编码 */
export async function readTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const encoding = detectEncoding(buffer)
  try {
    const decoder = new TextDecoder(encoding, { fatal: false })
    return decoder.decode(buffer)
  } catch {
    // 解码失败时回退到 UTF-8
    return new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  }
}

/** 根据 fileName + fileSize 生成天然去重 ID */
export function generateId(fileName: string, fileSize: number): string {
  return `${fileName}::${fileSize}`
}

/** 截取内容摘要（头 3000 字 + 尾 1000 字） */
export function extractSummary(content: string): string {
  const head = content.slice(0, HEAD_LENGTH)
  if (content.length <= HEAD_LENGTH + TAIL_LENGTH) {
    return head
  }
  const tail = content.slice(-TAIL_LENGTH)
  return `${head}\n\n...（中间省略）...\n\n${tail}`
}

/** 从 File 对象创建 Novel 实体 */
export function createNovelFromFile(
  file: File,
  content: string,
  tags: Tag[] = [],
): Novel {
  return {
    id: generateId(file.name, file.size),
    fileName: file.name,
    fileSize: file.size,
    contentSummary: extractSummary(content),
    tags,
    tagNames: tags.map((t) => t.name),
    importTime: Date.now(),
    updateTime: Date.now(),
  }
}

/** 检测浏览器是否支持 showDirectoryPicker */
export function isDirectoryPickerSupported(): boolean {
  return 'showDirectoryPicker' in window
}
