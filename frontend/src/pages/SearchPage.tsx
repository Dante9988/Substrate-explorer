import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, Users, Activity, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setSearchError(null)
    
    try {
      const trimmedQuery = query.trim()
      
      // Simple routing based on input type
      if (trimmedQuery.startsWith('5') && trimmedQuery.length === 48) {
        // Substrate address - route directly
        navigate(`/address/${trimmedQuery}`)
      } else if (!isNaN(Number(trimmedQuery)) && Number(trimmedQuery) > 0) {
        // Block number - route directly
        navigate(`/block/${trimmedQuery}`)
      } else if (trimmedQuery.startsWith('0x') && trimmedQuery.length === 66) {
        // Hex hash - try as extrinsic first, then as block hash
        navigate(`/extrinsic/${trimmedQuery}`)
      } else {
        // Try as extrinsic hash (fallback)
        navigate(`/extrinsic/${trimmedQuery}`)
      }
    } catch (error: any) {
      console.error('Search error:', error)
      setSearchError(`Search failed: ${error.message || 'Unknown error'}`)
      setTimeout(() => setSearchError(null), 5000)
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

  const searchExamples = [
    {
      title: 'Block Number',
      description: 'Search for a specific block by its number',
      example: '13497',
      icon: Hash,
      color: 'blue'
    },
    {
      title: 'Substrate Address',
      description: 'Search for transactions and events related to an address',
      example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Extrinsic Hash',
      description: 'Search for a specific transaction by its hash',
      example: '0xd5f11f78b3d3a3c91c11b86b682aefd5327760ba96ae9537d7b3a9fd35057924',
      icon: Activity,
      color: 'purple'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Blockchain Search
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Search the Creditcoin blockchain by block number, address, or transaction hash
        </p>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter block number, address, or hash..."
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200 shadow-lg"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Search Blockchain</span>
              </>
            )}
          </button>
        </form>

        {/* Input Type Detection */}
        {query && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                Detected as: {detectInputType(query)}
              </span>
            </div>
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{searchError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Examples */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          Search Examples
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {searchExamples.map((example) => {
            const Icon = example.icon
            return (
              <div
                key={example.title}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => setQuery(example.example)}
              >
                <div className={`w-12 h-12 ${getColorClasses(example.color)} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {example.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {example.description}
                </p>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                    {example.example}
                  </code>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Search Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="space-y-2">
            <p><strong>• Block Numbers:</strong> Enter any positive integer to find a specific block</p>
            <p><strong>• Addresses:</strong> Substrate addresses start with '5' and are 48 characters long</p>
          </div>
          <div className="space-y-2">
            <p><strong>• Transaction Hashes:</strong> Hex strings starting with '0x' and 66 characters long</p>
            <p><strong>• Real-time:</strong> All data is fetched live from the blockchain</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage
