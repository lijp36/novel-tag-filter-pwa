import { useState, useCallback } from 'react'
import { db } from '@/db'
import {
  createNovelFromFile,
  readTextFile,
  isDirectoryPickerSupported,
} from '@/services/file'
import type { Novel } from '@/types'

export function useFileReader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const directoryPickerSupported = isDirectoryPickerSupported()

  const importFiles = useCallback(async (files: FileList | File[]) => {
    setLoading(true)
    setProgress({ current: 0, total: files.length })
    const novels: Novel[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.name.endsWith('.txt')) continue
      const content = await readTextFile(file)
      const novel = createNovelFromFile(file, content)
      await db.novels.put(novel)
      novels.push(novel)
      setProgress({ current: i + 1, total: files.length })
    }

    setLoading(false)
    return novels
  }, [])

  const deleteNovels = useCallback(async (ids: string[]) => {
    await db.novels.bulkDelete(ids)
  }, [])

  return {
    loading,
    progress,
    importFiles,
    deleteNovels,
    directoryPickerSupported,
  }
}
