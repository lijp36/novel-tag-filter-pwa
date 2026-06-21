import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar, Button, ProgressBar, Dialog } from 'antd-mobile'
import { useFileReader } from '@/hooks/useFileReader'
import { useAITagger } from '@/hooks/useAITagger'
import { getActiveModelConfig } from '@/services/model'

export default function ImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loading, progress, importFiles, directoryPickerSupported } =
    useFileReader()
  const { tagNovels } = useAITagger()
  const [imported, setImported] = useState(0)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const novels = await importFiles(files)

    const config = getActiveModelConfig()
    if (config && novels.length > 0) {
      Dialog.confirm({
        content: `成功导入 ${novels.length} 本小说，是否立即进行 AI 标签提取？`,
        confirmText: '开始提取',
        cancelText: '稍后再说',
        onConfirm: async () => {
          await tagNovels(novels, config)
          navigate('/')
        },
        onCancel: () => {
          navigate('/')
        },
      })
    } else {
      setImported(novels.length)
    }
  }

  const handleDirectoryPick = async () => {
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker()
      const files: File[] = []
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          files.push(file)
        }
      }
      if (files.length > 0) {
        const novels = await importFiles(files)
        const config = getActiveModelConfig()
        if (config) {
          Dialog.confirm({
            content: `成功导入 ${novels.length} 本小说，是否立即进行 AI 标签提取？`,
            confirmText: '开始提取',
            cancelText: '稍后再说',
            onConfirm: async () => {
              await tagNovels(novels, config)
              navigate('/')
            },
            onCancel: () => {
              navigate('/')
            },
          })
        } else {
          setImported(novels.length)
        }
      }
    } catch {
      // 用户取消选择或权限不足，忽略
    }
  }

  return (
    <div>
      <NavBar onBack={() => navigate(-1)}>导入小说</NavBar>
      <div style={{ padding: 16 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Button
          block
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          loading={loading}
        >
          选择 TXT 文件
        </Button>
        {directoryPickerSupported && (
          <Button
            block
            style={{ marginTop: 12 }}
            onClick={handleDirectoryPick}
            loading={loading}
          >
            选择整个文件夹（增强）
          </Button>
        )}
        {loading && (
          <div style={{ marginTop: 16 }}>
            <ProgressBar
              percent={Math.round((progress.current / progress.total) * 100)}
            />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              {progress.current} / {progress.total}
            </div>
          </div>
        )}
        {imported > 0 && !loading && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 16,
              color: '#1677ff',
              fontSize: 15,
            }}
          >
            成功导入 {imported} 本小说
          </div>
        )}
      </div>
    </div>
  )
}
