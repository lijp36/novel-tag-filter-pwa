import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import HomePage from './pages/Home'
import ImportPage from './pages/Import'
import DetailPage from './pages/Detail'
import TagManagerPage from './pages/TagManager'
import ModelManagerPage from './pages/ModelManager'
import 'antd-mobile/es/global'
import './index.css'
import { initDefaultTagDefs } from './db'

// 初始化预设标签
initDefaultTagDefs()

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'detail/:id', element: <DetailPage /> },
      { path: 'tags', element: <TagManagerPage /> },
      { path: 'models', element: <ModelManagerPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

// PWA Service Worker 注册
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onOfflineReady() {
        console.log('App ready to work offline')
      },
    })
  })
}
