import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db'
import { SearchBar, Tag, Space, Button, Checkbox, Popup, Toast } from 'antd-mobile'
import { UnorderedListOutline } from 'antd-mobile-icons'
import { useFileReader } from '@/hooks/useFileReader'
import { useAITagger } from '@/hooks/useAITagger'
import AITagger from '@/components/AITagger'
import { getActiveModelConfig } from '@/services/model'
import type { Novel, AIServiceConfig } from '@/types'

export default function HomePage() {
  const navigate = useNavigate()
  const { deleteNovels } = useFileReader()
  const { loading: tagLoading, progress: tagProgress, tagNovels } = useAITagger()
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [showTagProgress, setShowTagProgress] = useState(false)

  const novels = useLiveQuery(() =>
    db.novels.orderBy('importTime').reverse().toArray(),
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDelete = async () => {
    const ids = Array.from(selectedIds)
    await deleteNovels(ids)
    setSelectedIds(new Set())
    setSelectMode(false)
    setShowDeleteConfirm(false)
  }

  const handleAIExtract = useCallback(async (config: AIServiceConfig) => {
    if (!novels) return

    let targetNovels: Novel[]

    if (selectMode && selectedIds.size > 0) {
      // 多选模式：只处理选中的
      targetNovels = novels.filter((n) => selectedIds.has(n.id))
    } else {
      // 正常模式：处理所有未打标的
      targetNovels = novels.filter((n) => n.tags.length === 0)
    }

    if (targetNovels.length === 0) {
      Toast.show({ content: selectMode ? '选中的小说已全部打标' : '所有小说都已打标', duration: 2000 })
      return
    }

    setShowTagProgress(true)
    await tagNovels(targetNovels, config)
    if (!selectMode) {
      setShowTagProgress(false)
      Toast.show({ content: `已完成 ${targetNovels.length} 本小说标签提取`, duration: 2000 })
    }
  }, [novels, selectMode, selectedIds, tagNovels])

  const handleAIClick = () => {
    const config = getActiveModelConfig()
    if (!config) {
      // 未配置 → 弹出配置弹窗
      setShowAIConfig(true)
    } else {
      handleAIExtract(config)
    }
  }

  // 多选模式下的 AI 提取完成后关闭进度
  const handleSelectAIDone = async () => {
    const config = getActiveModelConfig()
    if (!config) {
      setShowAIConfig(true)
      return
    }
    setShowTagProgress(true)
    if (novels) {
      const targetNovels = novels.filter((n) => selectedIds.has(n.id))
      if (targetNovels.length > 0) {
        await tagNovels(targetNovels, config)
      }
    }
    setShowTagProgress(false)
    setSelectMode(false)
    setSelectedIds(new Set())
    Toast.show({ content: 'AI 标签提取完成', duration: 1500 })
  }

  return (
    <div style={{ padding: 12 }}>
      {/* 顶部操作栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <SearchBar placeholder="搜索小说..." />
        </div>
        {!selectMode ? (
            <>
            <Button size="small" color="primary" fill="none" onClick={handleAIClick}>
                AI 提取
            </Button>
            <Button size="small" color="default" onClick={() => navigate('/models')}>
                <UnorderedListOutline />
            </Button>
            <Button
                size="small"
                color="default"
                onClick={() => setSelectMode(true)}
            >
                管理
            </Button>
            </>
        ) : (
          <>
            <Button
              size="small"
              color="primary"
              fill="none"
              onClick={handleSelectAIDone}
              loading={tagLoading}
            >
              提取选中 ({selectedIds.size})
            </Button>
            <Button
              size="small"
              color="danger"
              onClick={() => {
                if (selectedIds.size === 0) {
                  setSelectMode(false)
                  return
                }
                setShowDeleteConfirm(true)
              }}
            >
              删除 ({selectedIds.size})
            </Button>
          </>
        )}
      </div>

      {/* 标签筛选区 */}
      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>标签筛选</h3>
        <Space wrap>
          <Tag>全部</Tag>
        </Space>
      </div>

      {/* 小说列表 */}
      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>
          小说列表 ({novels?.length ?? 0})
          {selectMode && (
            <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
              已选 {selectedIds.size} 项
            </span>
          )}
        </h3>
        {novels?.map((novel) => (
          <div
            key={novel.id}
            onClick={() => {
              if (selectMode) {
                toggleSelect(novel.id)
              } else {
                navigate(`/detail/${encodeURIComponent(novel.id)}`)
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 0',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
            }}
          >
            {selectMode && (
              <Checkbox
                checked={selectedIds.has(novel.id)}
                style={{ '--icon-size': '18px', marginTop: 2 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15 }}>{novel.fileName}</div>
              <Space wrap style={{ marginTop: 4 }}>
                {novel.tags.map((tag, i) => (
                  <Tag
                    key={i}
                    color={tag.source === 'ai' ? 'primary' : 'success'}
                    style={{ fontSize: 11 }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        ))}
        {(!novels || novels.length === 0) && (
          <div
            style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}
          >
            还没有导入小说，点击下方「导入」开始
          </div>
        )}
      </div>

      {/* AI 配置弹窗 */}
      <AITagger
        visible={showAIConfig}
        onClose={() => setShowAIConfig(false)}
        onSaved={(config) => {
          handleAIExtract(config)
        }}
      />

      {/* AI 提取进度弹窗 */}
      <Popup
        visible={showTagProgress}
        bodyStyle={{
          padding: '24px 16px',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          正在提取标签...
        </div>
        <div style={{ color: '#666', fontSize: 14 }}>
          {tagProgress.current} / {tagProgress.total}
        </div>
        {tagProgress.total > 0 && (
          <div
            style={{
              marginTop: 12,
              height: 6,
              borderRadius: 3,
              background: '#eee',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(tagProgress.current / tagProgress.total) * 100}%`,
                height: '100%',
                background: '#1677ff',
                borderRadius: 3,
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}
        {/* 提取完成后多选模式不自动关闭，留给用户看进度 */}
        {!selectMode && tagProgress.current > 0 && tagProgress.current === tagProgress.total && (
          <Button
            size="small"
            style={{ marginTop: 12 }}
            onClick={() => setShowTagProgress(false)}
          >
            完成
          </Button>
        )}
      </Popup>

      {/* 删除确认弹窗 */}
      <Popup
        visible={showDeleteConfirm}
        onMaskClick={() => setShowDeleteConfirm(false)}
        bodyStyle={{
          padding: '20px 16px',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            确认删除
          </div>
          <div style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>
            确定要删除选中的 {selectedIds.size} 本小说吗？此操作不可撤销。
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              block
              onClick={() => setShowDeleteConfirm(false)}
            >
              取消
            </Button>
            <Button block color="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}
