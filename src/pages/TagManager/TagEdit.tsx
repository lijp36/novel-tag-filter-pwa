import { useEffect, useState } from 'react'
import { Dialog, Input, TextArea, Tag, Space, Button, Toast } from 'antd-mobile'
import type { TagDef } from '@/types'

interface Props {
  visible: boolean
  tag: TagDef | null
  onClose: () => void
  onSave: (values: Partial<TagDef>) => void
}

export default function TagEdit({ visible, tag, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])

  useEffect(() => {
    if (visible) {
      setName(tag?.name ?? '')
      setDescription(tag?.description ?? '')
      setKeywords(tag?.keywords ?? [])
      setKeywordInput('')
    }
  }, [visible, tag])

  const handleAddKeyword = () => {
    const kw = keywordInput.trim()
    if (!kw) return
    if (keywords.includes(kw)) {
      Toast.show({ content: '关键词已存在', duration: 1000 })
      return
    }
    setKeywords([...keywords, kw])
    setKeywordInput('')
  }

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw))
  }

  const handleSave = () => {
    if (!name.trim()) {
      Toast.show({ content: '请填写标签名称', duration: 1500 })
      return
    }
    if (!description.trim()) {
      Toast.show({ content: '请填写标签描述', duration: 1500 })
      return
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      keywords,
    })
  }

  return (
    <Dialog
      visible={visible}
      title={tag ? '编辑标签' : '新增标签'}
      content={
        <div>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 13,
                color: '#666',
                marginBottom: 4,
              }}
            >
              标签名
            </div>
            <Input
              placeholder="如：BE"
              value={name}
              onChange={(val) => setName(val)}
              style={{
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 13,
                color: '#666',
                marginBottom: 4,
              }}
            >
              描述（告诉 AI 这个标签的含义）
            </div>
            <TextArea
              placeholder="如：悲剧结局，主角死亡或永远分离"
              value={description}
              onChange={(val) => setDescription(val)}
              rows={3}
              style={{
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 13,
                color: '#666',
                marginBottom: 4,
              }}
            >
              关键词（可选，出现这些词时倾向于打此标签）
            </div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Input
                placeholder="输入关键词"
                value={keywordInput}
                onChange={(val) => setKeywordInput(val)}
                onEnterPress={handleAddKeyword}
                style={{
                  flex: 1,
                  background: '#f5f5f5',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <Button
                size="small"
                onClick={handleAddKeyword}
              >
                添加
              </Button>
            </div>
            <Space wrap>
              {keywords.map((kw) => (
                <Tag
                  key={kw}
                  color="primary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRemoveKeyword(kw)}
                >
                  {kw} ×
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      }
      actions={[
        { key: 'cancel', text: '取消' },
        {
          key: 'save',
          text: '保存',
          onClick: handleSave,
        },
      ]}
      onClose={onClose}
    />
  )
}
