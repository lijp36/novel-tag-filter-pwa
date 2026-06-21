import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TabBar, SafeArea } from 'antd-mobile'
import { AppOutline, AddCircleOutline, TagOutline } from 'antd-mobile-icons'

const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/tags', title: '标签', icon: <TagOutline /> },
  { key: '/import', title: '导入', icon: <AddCircleOutline /> },
]

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <SafeArea position="top" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      <TabBar
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
        style={{ borderTop: '1px solid var(--adm-border-color)' }}
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
      <SafeArea position="bottom" />
    </div>
  )
}
