import type { AIServiceConfig, AIExtractRequest, AIExtractResponse, Tag, TagDef } from '@/types'

/**
 * 智能构建提示词：将标签定义（名称+描述+关键词）拼入提示词
 */
function buildPrompt(tagDefs: TagDef[]): string {
  const tagLines = tagDefs
    .filter((t) => t.enabled)
    .map((t) => {
      const kw = t.keywords.length > 0 ? `（关键词：${t.keywords.join('、')}）` : ''
      return `- ${t.name}：${t.description}${kw}`
    })
    .join('\n')

  return `你是一个小说标签提取专家。根据提供的小说内容摘要（包含开头部分和结尾部分，中间已省略），从以下可用标签中选择匹配的标签。

注意：摘要分为开头和结尾两部分，中间用"（中间省略）"分隔。请结合开头的故事背景和结尾的结局来判断标签。

可用标签及含义：
${tagLines}

重要规则：
1. BE（悲剧结局）和 HE（美好结局）是互斥的，一部小说只能选其中一个，不能同时出现
2. 如果你无法判断结局是悲是喜，BE 和 HE 都不要标
3. 关键词只是辅助参考，关键要看内容的实际含义
4. 只返回JSON数组，不要其他内容
5. 如果无法判断某个标签，不要包含它
6. confidence范围0~1，0.7以上表示较高把握
7. 宁可漏标也不要错标——不确定的标签不要输出

请以JSON数组格式返回，每个标签包含name、confidence字段。示例：
[{"name":"BE","confidence":0.9},{"name":"虐文","confidence":0.85}]`
}

/**
 * 关键字预检：对摘要做简单关键字匹配
 * 返回匹配到的标签ID集合
 *
 * 注意：对于过短（2字符及以下）或可能产生误匹配的关键词，做更严格的匹配
 */
export function keywordPreCheck(
  content: string,
  tagDefs: TagDef[],
): Set<string> {
  const matched = new Set<string>()

  for (const def of tagDefs) {
    if (!def.enabled) continue
    for (const kw of def.keywords) {
      const isShort = kw.length <= 2
      let found: boolean

      if (isShort) {
        // 短关键词用正则精确匹配（前后必须是汉字边界或非字母数字）
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(`(?<=^|[^\\p{L}])${escaped}(?=$|[^\\p{L}])`, 'ui')
        found = re.test(content)
      } else {
        found = content.includes(kw)
      }

      if (found) {
        matched.add(def.name)
        break
      }
    }
  }

  return matched
}

/** 标签提取响应中的标签纯净版（不含用户额外字段） */
interface RawTag {
  name: string
  confidence?: number
}

/** 调用 AI 接口提取标签 */
export async function extractTags(
  config: AIServiceConfig,
  request: AIExtractRequest,
  tagDefs: TagDef[] = [],
): Promise<AIExtractResponse> {
  const prompt = buildPrompt(tagDefs)
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: request.content },
      ],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  const contentText: string = data.choices?.[0]?.message?.content ?? '[]'

  // 解析 AI 结果
  let aiTags: Tag[] = []
  try {
    const parsed = JSON.parse(contentText)
    aiTags = Array.isArray(parsed)
      ? parsed
          .filter((t: RawTag) => t.name && t.confidence != null)
          .map((t: RawTag) => ({
            name: t.name,
            source: 'ai' as const,
            confidence: t.confidence ?? 0.5,
          }))
      : []
  } catch {
    aiTags = []
  }

  // 关键字预检（补充标记）
  const keywordMatched = keywordPreCheck(request.content, tagDefs)
  for (const tagName of keywordMatched) {
    // 如果 AI 没有打这个标签，但关键字命中了，以低置信度补充
    if (!aiTags.some((t) => t.name === tagName)) {
      aiTags.push({
        name: tagName,
        source: 'ai',
        confidence: 0.5,
      })
    }
  }

  return { tags: aiTags }
}
