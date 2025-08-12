import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Search } from 'lucide-react'
import { getLatestBlockInfo, getBlockInfo, getBlockInfoByHash } from '../services/api'

interface BlockInfo {
  number: number
  hash: string
  extrinsicsCount: number
  eventsCount: number
  timestamp: number
}

const BlocksPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [blocks, setBlocks] = useState<BlockInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Check if there's a block hash in the URL params
  const blockHashFromUrl = searchParams.get('hash')
  const blockNumberFromUrl = searchParams.get('number')

  useEffect(() => {
    if (blockHashFromUrl) {
      // If we have a block hash in URL, search for that specific block
      searchBlockByHash(blockHashFromUrl)
    } else if (blockNumberFromUrl) {
      // If we have a block number in URL, search around that block
      searchBlockByNumber(parseInt(blockNumberFromUrl))
    } else {
      // Default: fetch latest blocks
      fetchLatestBlocks()
    }
  }, [blockHashFromUrl, blockNumberFromUrl])

  const searchBlockByHash = async (blockHash: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setLoadingProgress({ current: 0, total: 1 })
      
      console.log('Starting search for block hash:', blockHash)
      
      // First, get the block info by hash
      const blockData = await getBlockInfoByHash(blockHash)
      const targetBlockNumber = blockData.number
      
      console.log('Found block by hash:', blockData.number, 'hash:', blockData.hash)
      
      setLoadingProgress({ current: 1, total: 1 })
      
      // Now fetch blocks around this target block
      await fetchBlocksAroundNumber(targetBlockNumber)
      
    } catch (err) {
      console.error('Failed to search block by hash:', err)
      setError(err instanceof Error ? err.message : 'Failed to find block by hash')
      setIsLoading(false)
      setLoadingProgress({ current: 0, total: 0 })
    }
  }

  const searchBlockByNumber = async (blockNumber: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Starting search for block number:', blockNumber)
      
      // Fetch blocks around this specific block number
      await fetchBlocksAroundNumber(blockNumber)
      
    } catch (err) {
      console.error('Failed to search block by number:', err)
      setError(err instanceof Error ? err.message : 'Failed to find block by number')
      setIsLoading(false)
    }
  }

  const fetchBlocksAroundNumber = async (targetBlockNumber: number) => {
    try {
      console.log('Fetching blocks around number:', targetBlockNumber)
      
      // Fetch blocks around the target block (10 before, 10 after)
      const blocksToFetch = 21 // 10 before + target + 10 after
      const startBlock = Math.max(1, targetBlockNumber - 10)
      const endBlock = targetBlockNumber + 10
      
      console.log(`Fetching blocks from #${startBlock} to #${endBlock}`)
      
      setLoadingProgress({ current: 0, total: blocksToFetch })
      
      const allBlocks: BlockInfo[] = []
      
      // Fetch blocks in smaller batches
      const batchSize = 5
      let totalLoaded = 0
      
      for (let i = startBlock; i <= endBlock; i += batchSize) {
        const batchEnd = Math.min(i + batchSize - 1, endBlock)
        const batchPromises: Promise<BlockInfo>[] = []
        
        for (let j = i; j <= batchEnd; j++) {
          if (j > 0) {
            batchPromises.push(
              getBlockInfo(j).then(blockData => ({
                number: blockData.number,
                hash: blockData.hash,
                extrinsicsCount: blockData.extrinsicsCount,
                eventsCount: blockData.eventsCount,
                timestamp: blockData.timestamp
              }))
            )
          }
        }
        
        // Wait for this batch to complete
        const batchResults = await Promise.all(batchPromises)
        allBlocks.push(...batchResults)
        totalLoaded += batchResults.length
        
        // Update progress
        setLoadingProgress({ current: totalLoaded, total: blocksToFetch })
        
        // Small delay between batches
        if (i + batchSize <= endBlock) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log(`Successfully loaded ${allBlocks.length} blocks around #${targetBlockNumber}`)
      
      // Sort blocks by number (newest first)
      const sortedBlocks = allBlocks.sort((a, b) => b.number - a.number)
      setBlocks(sortedBlocks)
      setIsLoading(false)
      
    } catch (err) {
      console.error('Failed to fetch blocks around number:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks around target block')
      setIsLoading(false)
      setLoadingProgress({ current: 0, total: 0 })
    }
  }

  const fetchLatestBlocks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      // Get the latest block info first
      const latestBlockInfo = await getLatestBlockInfo()
      const latestBlockNumber = latestBlockInfo.number
      
      // Fetch the last 20 blocks (reduced from 50 to avoid overwhelming the API)
      const blocksToFetch = Math.min(20, latestBlockNumber)
      const allBlocks: BlockInfo[] = []
      
      // Fetch blocks in smaller batches to be more efficient
      const batchSize = 5
      let totalLoaded = 0
      setLoadingProgress({ current: 0, total: blocksToFetch })
      
      for (let i = 0; i < blocksToFetch; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, blocksToFetch)
        const batchPromises: Promise<BlockInfo>[] = []
        
        for (let j = i; j < batchEnd; j++) {
          const blockNumber = latestBlockNumber - j
          if (blockNumber > 0) {
            batchPromises.push(
              getBlockInfo(blockNumber).then(blockData => ({
                number: blockData.number,
                hash: blockData.hash,
                extrinsicsCount: blockData.extrinsicsCount,
                eventsCount: blockData.eventsCount,
                timestamp: blockData.timestamp
              }))
            )
          }
        }
        
        // Wait for this batch to complete before starting the next one
        const batchResults = await Promise.all(batchPromises)
        allBlocks.push(...batchResults)
        totalLoaded += batchResults.length
        
        // Update progress
        setLoadingProgress({ current: totalLoaded, total: blocksToFetch })
        
        // Small delay between batches to be gentle on the API
        if (i + batchSize < blocksToFetch) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Sort blocks by number (newest first)
      const sortedBlocks = allBlocks.sort((a, b) => b.number - a.number)
      
      setBlocks(sortedBlocks)
    } catch (err) {
      console.error('Failed to fetch blocks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setLoadingProgress({ current: 0, total: 0 })
    }
  }

  const handleRefresh = () => {
    if (blockHashFromUrl) {
      searchBlockByHash(blockHashFromUrl)
    } else if (blockNumberFromUrl) {
      searchBlockByNumber(parseInt(blockNumberFromUrl))
    } else {
      fetchLatestBlocks(true)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      const query = searchQuery.trim()
      
      if (query.startsWith('0x') && query.length === 66) {
        // Block hash
        console.log('Searching for block hash:', query)
        await searchBlockByHash(query)
      } else if (!isNaN(Number(query)) && Number(query) > 0) {
        // Block number
        console.log('Searching for block number:', query)
        await searchBlockByNumber(parseInt(query))
      } else {
        setError('Invalid input. Please enter a block hash (0x...) or block number.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const formatHash = (hash: string) => {
    if (hash.length > 20) {
      return `${hash.slice(0, 10)}...${hash.slice(-10)}`
    }
    return hash
  }

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds} secs ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading blocks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => fetchLatestBlocks()} 
              className="btn-primary w-full"
            >
              Try Again
            </button>
            <Link to="/" className="btn-secondary w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recent Blocks</h1>
            <p className="text-gray-600">Latest blocks from the blockchain</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Search Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Blocks</h2>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter block hash (0x...) or block number..."
            className="flex-1 input-field"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
          {(blockHashFromUrl || blockNumberFromUrl) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                fetchLatestBlocks()
              }}
              className="btn-secondary"
            >
              Clear Search
            </button>
          )}
        </form>
        <p className="text-sm text-gray-600 mt-2">
          {blockHashFromUrl || blockNumberFromUrl 
            ? `Currently showing blocks around ${blockHashFromUrl || blockNumberFromUrl}. Search for a different block or clear to see latest blocks.`
            : 'Search for a specific block by hash or number to see surrounding blocks'
          }
        </p>
      </div>

      {/* Blocks Summary */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            {blockHashFromUrl || blockNumberFromUrl ? (
              <>
                Showing blocks around {blockHashFromUrl ? 'hash' : 'block'} {blockHashFromUrl || blockNumberFromUrl}
                <button
                  onClick={() => {
                    setSearchQuery('')
                    fetchLatestBlocks()
                  }}
                  className="ml-3 text-sm text-blue-700 hover:text-blue-900 underline"
                >
                  (Show latest blocks)
                </button>
              </>
            ) : (
              `Latest Block: #${blocks[0]?.number?.toLocaleString() || 'Loading...'}`
            )}
          </h2>
          <p className="text-blue-700 text-sm">
            Showing {blocks.length} blocks
            {isLoading && <span className="ml-2">• Loading...</span>}
          </p>
          
          {/* Progress Bar */}
          {isLoading && loadingProgress.total > 0 && (
            <div className="mt-3">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-blue-700 text-xs mt-1">
                Loading blocks... {loadingProgress.current} of {loadingProgress.total}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Blocks List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extrinsics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blocks.map((block) => (
                <tr key={block.number} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/block/${block.number}`}
                      className="font-mono text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      #{block.number.toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/block/hash/${block.hash}`}
                      className="font-mono text-sm text-gray-900 hover:text-primary-600"
                    >
                      {formatHash(block.hash)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {block.extrinsicsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {block.eventsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTimeAgo(block.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Blocks Message */}
      {blocks.length === 0 && !isLoading && (
        <div className="card text-center">
          <p className="text-gray-600">No blocks found</p>
          <button 
            onClick={() => fetchLatestBlocks()} 
            className="btn-primary mt-2"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Debug Info (only show in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="card bg-gray-50 border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>URL Hash: {blockHashFromUrl || 'none'}</p>
            <p>URL Number: {blockNumberFromUrl || 'none'}</p>
            <p>Search Query: {searchQuery || 'none'}</p>
            <p>Blocks Loaded: {blocks.length}</p>
            {blocks.length > 0 && (
              <p>Block Range: #{blocks[blocks.length - 1]?.number} - #{blocks[0]?.number}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BlocksPage
