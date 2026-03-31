import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: '不動産売買管理システム',
  description: '不動産売買案件の管理・分析ダッシュボード',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main
            className="flex-1 min-h-screen bg-gray-50"
            style={{ marginLeft: 'var(--sidebar-width)' }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
