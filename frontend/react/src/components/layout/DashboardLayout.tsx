import { Outlet } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function DashboardLayout() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="ml-60 flex min-h-screen flex-col">
        <TopBar />
        <motion.main
          id="main-content"
          className="flex-1 p-6"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
