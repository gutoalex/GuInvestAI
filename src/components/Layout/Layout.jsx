import Sidebar from './Sidebar'
import SyncIndicator from '../SyncIndicator'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-6 p-4 md:p-6">
        {children}
      </main>
      <SyncIndicator />
    </div>
  )
}
