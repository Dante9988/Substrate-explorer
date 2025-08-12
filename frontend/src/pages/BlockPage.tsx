import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Hash, Clock, Activity, Users, FileText, ExternalLink, Copy, CheckCircle, AlertCircle, Loader2, Calendar, ArrowUpRight } from 'lucide-react'
import { getBlockInfo, getBlockInfoByHash } from '../services/api'
import { BlockInfo } from '@blockchain-explorer/shared'

const BlockPage: React.FC = () => {
  const { blockNumber } = useParams<{ blockNumber: string }>()
  const [block, setBlock] = useState<BlockInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlock = async () => {
      if (!blockNumber) return
      
      setLoading(true)
      setError(null)
      
      try {
        let blockData: BlockInfo
        
        // Check if blockNumber is actually a hash
        if (blockNumber.startsWith('0x') && blockNumber.length === 66) {
          // It's a hash, use getBlockInfoByHash
          blockData = await getBlockInfoByHash(blockNumber)
        } else {
          // It's a block number
          blockData = await getBlockInfo(parseInt(blockNumber))
        }
        
        setBlock(blockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch block information')
      } finally {
        setLoading(false)
      }
    }

    fetchBlock()
  }, [blockNumber])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHash(type)
      setTimeout(() => setCopiedHash(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const formatHash = (hash: string) => {
    if (hash.length > 20) {
      return `${hash.slice(0, 10)}...${hash.slice(-10)}`
    }
    return hash
  }

  const formatAddress = (addr: string) => {
    if (addr.length > 20) {
      return `${addr.slice(0, 10)}...${addr.slice(-10)}`
    }
    return addr
  }

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading block information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
          <Link to="/" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!block) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-800 dark:text-yellow-200">Block not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="inline-flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Block #{block.number.toLocaleString()}
          </h1>
        </div>
      </div>

      {/* Block Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Block Overview</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Block Number */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Block Number</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">#{block.number.toLocaleString()}</p>
            </div>

            {/* Timestamp */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(block.timestamp).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getTimeAgo(block.timestamp)}
              </p>
            </div>

            {/* Extrinsics Count */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Extrinsics</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{block.extrinsicsCount}</p>
            </div>

            {/* Events Count */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Events</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{block.eventsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Block Hash Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Block Hash</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {block.hash}
            </code>
            <button
              onClick={() => copyToClipboard(block.hash, 'hash')}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Copy hash"
            >
              {copiedHash === 'hash' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extrinsics Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extrinsics ({block.extrinsicsCount})</h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {block.extrinsics && block.extrinsics.length > 0 ? (
            block.extrinsics.map((extrinsic: any, index: number) => (
              <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{index}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {extrinsic.section}.{extrinsic.method}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Extrinsic #{index} in Block #{block.number}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-12 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                          {formatHash(extrinsic.hash)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(extrinsic.hash, `extrinsic-${index}`)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Copy hash"
                        >
                          {copiedHash === `extrinsic-${index}` ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      
                      {extrinsic.signer && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Signer: {formatAddress(extrinsic.signer)}
                          </span>
                        </div>
                      )}
                      
                      {extrinsic.args && extrinsic.args.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Arguments:</span>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                              {JSON.stringify(extrinsic.args, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/extrinsic/${extrinsic.hash}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No extrinsics in this block</p>
            </div>
          )}
        </div>
      </div>

      {/* Events Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Events ({block.eventsCount})</h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {block.events && block.events.length > 0 ? (
            block.events.map((event: any, index: number) => (
              <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">{index}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.section}.{event.method}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Event #{index} in Block #{block.number}
                    </p>
                    
                    {event.data && event.data.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Event Data:</span>
                        <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No events in this block</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlockPage
