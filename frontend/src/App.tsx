import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import BlockPage from './pages/BlockPage'
import NetworkPage from './pages/NetworkPage'
import TransactionListPage from './pages/TransactionListPage'
import ExtrinsicPage from './pages/ExtrinsicPage'
import BlocksPage from './pages/BlocksPage'
import { ThemeProvider } from './contexts/ThemeContext'

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Header />
          <main className="container mx-auto px-4 py-6 max-w-7xl">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/block/hash/:blockHash" element={<BlockPage />} />
              <Route path="/block/:blockNumber" element={<BlockPage />} />
              <Route path="/network" element={<NetworkPage />} />
              <Route path="/address/:address" element={<TransactionListPage />} />
              <Route path="/extrinsic/:extrinsicHash" element={<ExtrinsicPage />} />
              <Route path="/blocks" element={<BlocksPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
