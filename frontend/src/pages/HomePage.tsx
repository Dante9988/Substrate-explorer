import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, Activity, Users, Zap } from 'lucide-react'
import LiveFeed from '../components/LiveFeed'

const HomePage: React.FC = () => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    
    try {
      // Simple routing based on input type
      if (query.startsWith('5') && query.length === 48) {
        // Substrate address - route directly
        navigate(`/address/${query}`)
      } else if (!isNaN(Number(query)) && Number(query) > 0) {
        // Block number - route directly
        navigate(`/block/${query}`)
      } else if (query.startsWith('0x') && query.length === 66) {
        // Hex hash - try as extrinsic first, then as block hash
        // This is the original working approach
        navigate(`/extrinsic/${query}`)
      } else {
        // Try as extrinsic hash (fallback)
        navigate(`/extrinsic/${query}`)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const detectInputType = (query: string): string => {
    if (query.startsWith('0x') && query.length === 66) {
      return 'Extrinsic Hash / Block Hash'
    } else if (query.startsWith('5') && query.length === 48) {
      return 'Substrate Address'
    } else if (!isNaN(Number(query)) && Number(query) > 0) {
      return 'Block Number'
    }
    return 'Address / Block Hash / Extrinsic Hash'
  }

  const quickSearchExamples = [
    { label: 'Block Number', example: '13497', icon: Hash },
    { label: 'Address', example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', icon: Users },
    { label: 'Extrinsic Hash', example: '0xd5f11f78b3d3a3c91c11b86b682aefd5327760ba96ae9537d7b3a9fd35057924', icon: Activity },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Blockchain
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Explorer
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore the substrate blockchain in real-time. Search blocks, transactions, and addresses with local explorer.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by block number, address, or hash..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200 shadow-lg hover:shadow-xl"
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Input Type Detection */}
          {query && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Detected:</span> {detectInputType(query)}
            </div>
          )}
        </div>

        {/* Quick Search Examples */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {quickSearchExamples.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => setQuery(item.example)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
            <Hash className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Block Explorer</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Browse blocks, view transactions, and explore the blockchain structure
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Transaction Tracking</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Track individual transactions and view detailed extrinsic information
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Address Lookup</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Search addresses and view their transaction history and balance
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Updates</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Live blockchain monitoring with real-time block and transaction updates
          </p>
        </div>
      </div>

      {/* Live Network Activity */}
      <LiveFeed />
    </div>
  )
}

export default HomePage
