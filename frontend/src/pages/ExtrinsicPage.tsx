import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Hash, Clock, Activity, Users, FileText, Copy, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { getExtrinsicInfo } from '../services/api'

interface ExtrinsicData {
  index: number
  hash: string
  section: string
  method: string
  signer: string
  nonce: number
  args: any[]
  events: Array<{
    section: string
    method: string
    data: any[]
  }>
}

interface BlockData {
  number: number
  hash: string
  timestamp: number
}

const ExtrinsicPage: React.FC = () => {
  const { extrinsicHash } = useParams<{ extrinsicHash: string }>()
  const [extrinsic, setExtrinsic] = useState<ExtrinsicData | null>(null)
  const [block, setBlock] = useState<BlockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  useEffect(() => {
    const fetchExtrinsic = async () => {
      if (!extrinsicHash) return
      
      setLoading(true)
      setError(null)
      
      try {
        const data = await getExtrinsicInfo(extrinsicHash)
        setExtrinsic(data.extrinsic)
        setBlock(data.block)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch extrinsic information')
      } finally {
        setLoading(false)
      }
    }

    fetchExtrinsic()
  }, [extrinsicHash])

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
        <p className="text-gray-600 dark:text-gray-300">Loading extrinsic information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
          
          {/* Simple suggestion for hex hashes */}
          {extrinsicHash && extrinsicHash.startsWith('0x') && extrinsicHash.length === 66 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                💡 <strong>Tip:</strong> If this is a block hash, try searching for it as a block instead.
              </p>
              <div className="mt-2">
                <Link
                  to={`/block/hash/${extrinsicHash}`}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Try as Block Hash
                </Link>
              </div>
            </div>
          )}
          
          <Link to="/" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!extrinsic || !block) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-800 dark:text-yellow-200">Extrinsic not found</p>
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
            Extrinsic Details
          </h1>
        </div>
      </div>

      {/* Extrinsic Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extrinsic Overview</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Extrinsic Index */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Index</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">#{extrinsic.index}</p>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Method</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {extrinsic.section}.{extrinsic.method}
              </p>
            </div>

            {/* Nonce */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nonce</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{extrinsic.nonce}</p>
            </div>

            {/* Block Number */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Block</span>
              </div>
              <Link 
                to={`/block/${block.number}`}
                className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                #{block.number.toLocaleString()}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Extrinsic Hash Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extrinsic Hash</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {extrinsic.hash}
            </code>
            <button
              onClick={() => copyToClipboard(extrinsic.hash, 'extrinsic')}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Copy hash"
            >
              {copiedHash === 'extrinsic' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Signer Card */}
      {extrinsic.signer && extrinsic.signer !== 'N/A' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signer</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {formatAddress(extrinsic.signer)}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(extrinsic.signer, 'signer')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Copy address"
              >
                {copiedHash === 'signer' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arguments Card */}
      {extrinsic.args && extrinsic.args.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arguments ({extrinsic.args.length})</h2>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(extrinsic.args, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Events Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Events ({extrinsic.events.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {extrinsic.events.length > 0 ? (
            extrinsic.events.map((event, index) => (
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
                      Event #{index} in Extrinsic #{extrinsic.index}
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
              <p>No events for this extrinsic</p>
            </div>
          )}
        </div>
      </div>

      {/* Block Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Block Information</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Block Number</span>
              </div>
              <Link 
                to={`/block/${block.number}`}
                className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                #{block.number.toLocaleString()}
              </Link>
            </div>

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

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Block Hash</span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="text-sm font-mono text-gray-900 dark:text-white">
                  {formatHash(block.hash)}
                </code>
                <button
                  onClick={() => copyToClipboard(block.hash, 'block')}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Copy hash"
                >
                  {copiedHash === 'block' ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExtrinsicPage
