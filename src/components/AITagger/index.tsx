import { useEffect } from 'react'
import { Form, Input, Dialog } from 'antd-mobile'
import type { ModelConfig } from '@/types'
import { loadModelConfigs, saveModelConfigs } from '@/services/model'

const DEFAULT_CONFIG: Omit<ModelConfig, 'id' | 'createdAt'> = {
  name: 'SiliconFlow Qwen2.5-7B',
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: '',
  model: 'Qwen/Qwen2.5-7B-Instruct',
  active: false,
}

interface Props {
  visible: boolean
  onClose: () => void
  onSaved: (config: ModelConfig) => void
}

export default function AITagger({ visible, onClose, onSaved }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible) {
      const configs = loadModelConfigs()
      if (configs.length > 0) {
        form.setFieldsValue({
          name: configs[0].name,
          baseURL: configs[0].baseURL,
          apiKey: configs[0].apiKey,
          model: configs[0].model,
        })
      } else {
        form.setFieldsValue(DEFAULT_CONFIG)
      }
    }
  }, [visible, form])

  const handleSave = async () => {
    const values = form.getFieldsValue()
    if (!values.apiKey?.trim() || !values.model?.trim()) {
      Dialog.alert({ content: '请填写 API Key 和模型名称' })
      return
    }

    // 把当前配置存为首个模型（简化：直接覆盖第一个或新增）
    const configs = loadModelConfigs()
    if (configs.length > 0) {
      // 更新第一个
      const updated = configs.map((c, i) =>
        i === 0 ? { ...c, ...values } : c,
      )
      saveModelConfigs(updated)
      onSaved({ ...configs[0]!, ...values })
    } else {
      const config: ModelConfig = {
        id: `model_${Date.now()}`,
        createdAt: Date.now(),
        ...values,
        active: true,
      }
      configs.push(config)
      saveModelConfigs(configs)
      onSaved(config)
    }
    onClose()
  }

  return (
    <Dialog
      visible={visible}
      title="AI 模型配置"
      content={
        <Form
          form={form}
          initialValues={DEFAULT_CONFIG}
          style={{ '--border-bottom': 'none' } as React.CSSProperties}
        >
          <Form.Item name="baseURL" label="API 地址">
            <Input placeholder="https://api.siliconflow.cn/v1" />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key">
            <Input placeholder="sk-..." type="password" clearable />
          </Form.Item>
          <Form.Item name="model" label="模型">
            <Input placeholder="Qwen/Qwen2.5-7B-Instruct" />
          </Form.Item>
        </Form>
      }
      actions={[
        { key: 'cancel', text: '取消' },
        {
          key: 'save',
          text: '保存并使用',
          onClick: handleSave,
        },
      ]}
      onClose={onClose}
    />
  )
}
