import { useState, useCallback } from 'react'
import { db } from '@/db'
import { extractTags } from '@/services/ai'
import type { AIServiceConfig, Novel, Tag } from '@/types'

export function useAITagger() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const tagNovels = useCallback(
    async (novels: Novel[], config: AIServiceConfig) => {
      setLoading(true)
      setProgress({ current: 0, total: novels.length })

      // 读取所有启用的标签定义
      const tagDefs = await db.tagDefs
        .filter((t) => t.enabled)
        .sortBy('order')

      for (let i = 0; i < novels.length; i++) {
        const novel = novels[i]
        try {
          const result = await extractTags(
            config,
            { content: novel.contentSummary },
            tagDefs,
          )
          const updatedTags: Tag[] = [
            ...novel.tags.filter((t) => t.source === 'manual'),
            ...result.tags,
          ]
          await db.novels.update(novel.id, {
            tags: updatedTags,
            tagNames: updatedTags.map((t) => t.name),
            updateTime: Date.now(),
          })
        } catch {
          // 跳过提取失败的，继续下一本
        }
        setProgress({ current: i + 1, total: novels.length })
      }

      setLoading(false)
    },
    [],
  )

  const tagSingleNovel = useCallback(
    async (novel: Novel, config: AIServiceConfig) => {
      setLoading(true)
      try {
        const tagDefs = await db.tagDefs
          .filter((t) => t.enabled)
          .sortBy('order')

        const result = await extractTags(
          config,
          { content: novel.contentSummary },
          tagDefs,
        )
        const updatedTags: Tag[] = [
          ...novel.tags.filter((t) => t.source === 'manual'),
          ...result.tags,
        ]
        await db.novels.update(novel.id, {
          tags: updatedTags,
          tagNames: updatedTags.map((t) => t.name),
          updateTime: Date.now(),
        })
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { loading, progress, tagNovels, tagSingleNovel }
}
