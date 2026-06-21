import { useState, useEffect } from 'react'
import {
  NavBar,
  Button,
  Dialog,
  Input,
  Toast,
  Tag,
} from 'antd-mobile'
import type { ModelConfig } from '@/types'
import { useNavigate } from 'react-router-dom'
import {
  loadModelConfigs,
  saveModelConfigs,
  setActiveModel,
  deleteModelConfig,
} from '@/services/model'

export default function ModelManagerPage() {
  const navigate = useNavigate()
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBaseURL, setEditBaseURL] = useState('')
  const [editApiKey, setEditApiKey] = useState('')
  const [editModel, setEditModel] = useState('')
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    setConfigs(loadModelConfigs())
  }, [])

  const refresh = () => setConfigs(loadModelConfigs())

  const openNew = () => {
    setEditingId(null)
    setEditName('')
    setEditBaseURL('https://api.siliconflow.cn/v1')
    setEditApiKey('')
    setEditModel('')
    setShowEditor(true)
  }

  const openEdit = (c: ModelConfig) => {
    setEditingId(c.id)
    setEditName(c.name)
    setEditBaseURL(c.baseURL)
    setEditApiKey(c.apiKey)
    setEditModel(c.model)
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!editName.trim() || !editBaseURL.trim() || !editModel.trim()) {
      Toast.show({ content: '请填写名称、API 地址和模型', duration: 1500 })
      return
    }
    if (editingId) {
      const all = loadModelConfigs()
      saveModelConfigs(all.map((c) =>
        c.id === editingId
          ? { ...c, name: editName.trim(), baseURL: editBaseURL.trim(), apiKey: editApiKey.trim(), model: editModel.trim() }
          : c,
      ))
      Toast.show({ content: '模型已更新', duration: 1500 })
    } else {
      const all = loadModelConfigs()
      all.push({
        id: `model_${Date.now()}`,
        name: editName.trim(),
        baseURL: editBaseURL.trim(),
        apiKey: editApiKey.trim(),
        model: editModel.trim(),
        active: all.length === 0,
        createdAt: Date.now(),
      })
      saveModelConfigs(all)
      if (all.length === 1) localStorage.setItem('model_active_id', all[0]!.id)
      Toast.show({ content: '新模型已添加', duration: 1500 })
    }
    setShowEditor(false)
    refresh()
  }

  const handleSetActive = (id: string) => {
    setActiveModel(id)
    Toast.show({ content: '已切换为当前模型', duration: 1000 })
    refresh()
  }

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确定删除这个模型配置吗？',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: () => {
        deleteModelConfig(id)
        refresh()
        Toast.show({ content: '已删除', duration: 1000 })
      },
    })
  }

  const handleTest = async (c: ModelConfig) => {
    setTestingId(c.id)
    try {
      const res = await fetch(`${c.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.apiKey}`,
        },
        body: JSON.stringify({
          model: c.model,
          messages: [
            { role: 'user', content: '回复"ok"即可' },
          ],
          max_tokens: 10,
        }),
      })
      if (res.ok) {
        Toast.show({ content: '连接成功！模型可用 ✅', duration: 2000 })
      } else {
        const err = await res.text().catch(() => '')
        Toast.show({ content: `连接失败 (${res.status}): ${err.slice(0, 50)}`, duration: 3000 })
      }
    } catch (e) {
      Toast.show({ content: `请求失败: ${(e as Error).message}`, duration: 3000 })
    }
    setTestingId(null)
  }

  return (
    <div style={{ padding: 12 }}>
      <NavBar onBack={() => navigate(-1)}>模型管理</NavBar>

      <div style={{ marginTop: 12 }}>
        {configs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            还没有添加模型，点击下方按钮新增
          </div>
        )}
        {configs.map((c) => (
          <div
            key={c.id}
            onClick={() => openEdit(c)}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</span>
              {c.active && (
                <Tag color="primary" style={{ fontSize: 10 }}>当前</Tag>
              )}
              {!c.apiKey && (
                <Tag color="default" style={{ fontSize: 10 }}>未填 Key</Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {c.model}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
              {c.baseURL}
            </div>
            <div
              style={{ display: 'flex', gap: 6, marginTop: 6 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!c.active && (
                <Button
                  size="mini"
                  color="primary"
                  fill="none"
                  onClick={() => handleSetActive(c.id)}
                >
                  设为当前
                </Button>
              )}
              <Button
                size="mini"
                fill="none"
                loading={testingId === c.id}
                onClick={() => handleTest(c)}
              >
                测试
              </Button>
              <Button
                size="mini"
                color="danger"
                fill="none"
                onClick={() => handleDelete(c.id)}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Button block color="primary" onClick={openNew}>
          + 新增模型
        </Button>
      </div>

      {/* 编辑弹窗 */}
      <Dialog
        visible={showEditor}
        title={editingId ? '编辑模型' : '新增模型'}
        content={
          <div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>名称（自定义）</div>
              <Input
                placeholder="如：SiliconFlow Qwen2.5-14B"
                value={editName}
                onChange={(v) => setEditName(v)}
                style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>API 地址</div>
              <Input
                placeholder="https://api.siliconflow.cn/v1"
                value={editBaseURL}
                onChange={(v) => setEditBaseURL(v)}
                style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>API Key</div>
              <Input
                placeholder="sk-..."
                type="password"
                value={editApiKey}
                onChange={(v) => setEditApiKey(v)}
                style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>模型</div>
              <Input
                placeholder="Qwen/Qwen2.5-7B-Instruct"
                value={editModel}
                onChange={(v) => setEditModel(v)}
                style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 14 }}
              />
            </div>
          </div>
        }
        actions={[
          { key: 'cancel', text: '取消' },
          { key: 'save', text: '保存', onClick: handleSave },
        ]}
        onClose={() => setShowEditor(false)}
      />
    </div>
  )
}
