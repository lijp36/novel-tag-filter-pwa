import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar, Tag, Space, Button, Input, Toast } from 'antd-mobile'
import { db } from '@/db'
import type { Tag as TagType } from '@/types'

const COMMON_TAGS = [
  'BE', 'HE', '互攻', '穿越', '重生', '虐文', '甜宠',
  '古风', '现代', '玄幻', '百合', '耽美', '校园', '职场',
  '宫斗', '权谋', '修仙', '系统', '快穿', '年代',
]

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const novel = useLiveQuery(
    async () => (id ? db.novels.get(decodeURIComponent(id)) : undefined),
    [id],
  )

  if (!novel) {
    return (
      <div>
        <NavBar onBack={() => navigate(-1)}>小说详情</NavBar>
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          加载中或小说不存在
        </div>
      </div>
    )
  }

  const handleAddTag = async () => {
    const name = newTagName.trim()
    if (!name) return

    const exists = novel.tags.some((t) => t.name === name)
    if (exists) {
      Toast.show({ content: '该标签已存在', duration: 1500 })
      setNewTagName('')
      return
    }

    const newTag: TagType = {
      name,
      source: 'manual',
      confidence: 1,
    }
    const updatedTags = [...novel.tags, newTag]
    await db.novels.update(novel.id, {
      tags: updatedTags,
      tagNames: updatedTags.map((t) => t.name),
      updateTime: Date.now(),
    })
    setNewTagName('')
    Toast.show({ content: `已添加标签「${name}」`, duration: 1500 })
  }

  const handleQuickAddTag = async (name: string) => {
    const exists = novel.tags.some((t) => t.name === name)
    if (exists) {
      Toast.show({ content: '该标签已存在', duration: 1500 })
      return
    }
    const newTag: TagType = {
      name,
      source: 'manual',
      confidence: 1,
    }
    const updatedTags = [...novel.tags, newTag]
    await db.novels.update(novel.id, {
      tags: updatedTags,
      tagNames: updatedTags.map((t) => t.name),
      updateTime: Date.now(),
    })
    Toast.show({ content: `已添加标签「${name}」`, duration: 1500 })
  }

  const handleRemoveTag = async (tagName: string) => {
    const updatedTags = novel.tags.filter((t) => t.name !== tagName)
    await db.novels.update(novel.id, {
      tags: updatedTags,
      tagNames: updatedTags.map((t) => t.name),
      updateTime: Date.now(),
    })
    Toast.show({ content: `已删除标签「${tagName}」`, duration: 1500 })
  }

  const handleConfirmAdd = () => {
    handleAddTag()
  }

  return (
    <div>
      <NavBar onBack={() => navigate(-1)}>{novel.fileName}</NavBar>
      <div style={{ padding: 16 }}>
        <div>
          <strong>文件大小：</strong>
          {(novel.fileSize / 1024).toFixed(1)} KB
        </div>

        {/* 标签区 */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <strong>标签：</strong>
            <Button
              size="small"
              color="primary"
              fill="none"
              onClick={() => setShowAddTag(!showAddTag)}
            >
              {showAddTag ? '收起' : '+ 添加'}
            </Button>
          </div>

          {/* 添加标签面板 */}
          {showAddTag && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                background: '#f9f9f9',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Input
                  placeholder="输入标签名"
                  value={newTagName}
                  onChange={(val) => setNewTagName(val)}
                  style={{ flex: 1, background: '#fff', padding: '4px 8px', borderRadius: 4 }}
                />
                <Button
                  size="small"
                  color="primary"
                  onClick={handleConfirmAdd}
                >
                  确认
                </Button>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>
                  快捷添加：
                </div>
                <Space wrap>
                  {COMMON_TAGS.map((name) => {
                    const exists = novel.tags.some((t) => t.name === name)
                    return (
                      <Tag
                        key={name}
                        color={exists ? 'default' : 'primary'}
                        style={{
                          opacity: exists ? 0.4 : 1,
                          cursor: 'pointer',
                        }}
                        onClick={() => !exists && handleQuickAddTag(name)}
                      >
                        {name}
                      </Tag>
                    )
                  })}
                </Space>
              </div>
            </div>
          )}

          {/* 现有标签 */}
          <Space wrap style={{ marginTop: 4 }}>
            {novel.tags.length > 0 ? (
              novel.tags.map((tag, i) => (
                <Tag
                  key={i}
                  color={tag.source === 'ai' ? 'primary' : 'success'}
                  style={{ position: 'relative', paddingRight: 4 }}
                >
                  {tag.name}
                  <span
                    onClick={() => handleRemoveTag(tag.name)}
                    style={{
                      marginLeft: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: '14px',
                      opacity: 0.6,
                    }}
                  >
                    ×
                  </span>
                </Tag>
              ))
            ) : (
              <span style={{ color: '#999' }}>暂无标签</span>
            )}
          </Space>
        </div>

        {/* 内容摘要 */}
        <div style={{ marginTop: 16 }}>
          <strong>内容摘要</strong>
          {novel.contentSummary.includes('（中间省略）') ? (
            <>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>开头：</div>
                <p
                  style={{
                    color: '#666',
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {novel.contentSummary.split('（中间省略）')[0]?.slice(0, 500)}
                  {(novel.contentSummary.split('（中间省略）')[0]?.length ?? 0) > 500 ? '...' : ''}
                </p>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>结尾：</div>
                <p
                  style={{
                    color: '#666',
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {novel.contentSummary.split('（中间省略）')[1]}
                </p>
              </div>
            </>
          ) : (
            <p
              style={{
                color: '#666',
                fontSize: 14,
                lineHeight: 1.6,
                marginTop: 4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {novel.contentSummary.slice(0, 500)}
              {novel.contentSummary.length > 500 ? '...' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
