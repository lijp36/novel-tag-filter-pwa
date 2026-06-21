import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  SearchBar,
  Tag,
  Space,
  Button,
  Switch,
  Popup,
  Toast,
} from 'antd-mobile'
import { db } from '@/db'
import TagEdit from './TagEdit'
import type { TagDef } from '@/types'

export default function TagManagerPage() {
  const [searchText, setSearchText] = useState('')
  const [editingTag, setEditingTag] = useState<TagDef | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const tagDefs = useLiveQuery(
    () => db.tagDefs.orderBy('order').toArray(),
    [],
  )

  const filteredTagDefs = tagDefs?.filter(
    (t) =>
      !searchText ||
      t.name.toLowerCase().includes(searchText.toLowerCase()),
  )

  const handleToggleEnabled = async (tag: TagDef) => {
    await db.tagDefs.update(tag.id, { enabled: !tag.enabled })
  }

  const handleSave = async (values: Partial<TagDef>) => {
    if (editingTag) {
      // 编辑已有标签
      await db.tagDefs.update(editingTag.id, values)
      Toast.show({ content: '标签已更新', duration: 1500 })
    } else {
      // 新增标签
      const maxOrder = tagDefs?.length ?? 0
      await db.tagDefs.add({
        id: `custom_${Date.now()}`,
        name: values.name!,
        description: values.description ?? '',
        keywords: values.keywords ?? [],
        enabled: true,
        order: maxOrder + 1,
      })
      Toast.show({ content: '新标签已添加', duration: 1500 })
    }
    setShowEdit(false)
    setEditingTag(null)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await db.tagDefs.delete(deletingId)
    setDeletingId(null)
    Toast.show({ content: '标签已删除', duration: 1500 })
  }

  return (
    <div style={{ padding: 12 }}>
      <SearchBar
        placeholder="搜索标签..."
        value={searchText}
        onChange={(val) => setSearchText(val)}
      />

      <div style={{ marginTop: 12 }}>
        {filteredTagDefs?.map((tag) => (
          <div
            key={tag.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              opacity: tag.enabled ? 1 : 0.45,
            }}
          >
            {/* 标签信息 */}
            <div
              style={{ flex: 1, minWidth: 0 }}
              onClick={() => {
                setEditingTag(tag)
                setShowEdit(true)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="primary" style={{ fontSize: 13 }}>
                  {tag.name}
                </Tag>
                {!tag.enabled && (
                  <span style={{ fontSize: 11, color: '#999' }}>已禁用</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#666',
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                {tag.description}
              </div>
              {tag.keywords.length > 0 && (
                <Space wrap style={{ marginTop: 3 }}>
                  {tag.keywords.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        color: '#999',
                        background: '#f5f5f5',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </Space>
              )}
            </div>

            {/* 操作 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 8,
              }}
            >
              <Switch
                checked={tag.enabled}
                onChange={() => handleToggleEnabled(tag)}
              />
              <Button
                size="small"
                fill="none"
                onClick={() => {
                  setDeletingId(tag.id)
                }}
                style={{ color: '#ff4d4f', fontSize: 18, padding: '0 4px' }}
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 新增按钮 */}
      <div
        style={{
          position: 'sticky',
          bottom: 12,
          marginTop: 16,
        }}
      >
        <Button
          block
          color="primary"
          onClick={() => {
            setEditingTag(null)
            setShowEdit(true)
          }}
        >
          + 新增标签
        </Button>
      </div>

      {/* 编辑弹窗 */}
      <TagEdit
        visible={showEdit}
        tag={editingTag}
        onClose={() => {
          setShowEdit(false)
          setEditingTag(null)
        }}
        onSave={handleSave}
      />

      {/* 删除确认 */}
      <Popup
        visible={!!deletingId}
        onMaskClick={() => setDeletingId(null)}
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
            删除后已打的小说标签不受影响，但 AI 提取时不再使用此标签。
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button block onClick={() => setDeletingId(null)}>
              取消
            </Button>
            <Button block color="danger" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}
