import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Hash, Users, Copy, CheckCircle, AlertCircle, Loader2, ArrowUpRight, Search, RefreshCw } from 'lucide-react'
import { searchAddress } from '../services/api'
import { TxHit } from '@blockchain-explorer/shared'

const TransactionListPage: React.FC = () => {
  const { address } = useParams<{ address: string }>()
  const [transactions, setTransactions] = useState<TxHit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blocksToScan, setBlocksToScan] = useState('10000')
  const [batchSize, setBatchSize] = useState('100')
  const [isSearching, setIsSearching] = useState(false)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      fetchTransactions()
    }
  }, [address])

  const fetchTransactions = async () => {
    if (!address) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await searchAddress(address, parseInt(blocksToScan), parseInt(batchSize))
      setTransactions(result.transactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return

    setIsSearching(true)
    setError(null)
    
    try {
      const result = await searchAddress(address, parseInt(blocksToScan), parseInt(batchSize))
      setTransactions(result.transactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

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



  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading transactions...</p>
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Address Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {address && formatAddress(address)}
            </p>
          </div>
        </div>
      </div>

      {/* Search Parameters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search Parameters</h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="blocksToScan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blocks to Scan
                </label>
                <input
                  id="blocksToScan"
                  type="number"
                  value={blocksToScan}
                  onChange={(e) => setBlocksToScan(e.target.value)}
                  min="1"
                  max="10000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Size
                </label>
                <input
                  id="batchSize"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={fetchTransactions}
                disabled={isSearching}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Results ({transactions.length} transactions)
          </h2>
        </div>
        
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions found for this address</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {tx.section}.{tx.method}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Block #{tx.blockNumber} • Extrinsic #{tx.extrinsicIndex || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-12 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                            {formatHash(tx.extrinsicHash)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(tx.extrinsicHash, `extrinsic-${index}`)}
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
                        
                        {tx.signer && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Signer: {formatAddress(tx.signer)}
                            </span>
                          </div>
                        )}
                        
                        {tx.args && tx.args.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Arguments:</span>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                                {JSON.stringify(tx.args, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        {tx.events && tx.events.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Events:</span>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                                {JSON.stringify(tx.events, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/extrinsic/${tx.extrinsicHash}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      
                      <Link
                        to={`/block/${tx.blockNumber}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <Hash className="h-4 w-4 mr-1" />
                        Block
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug Section (Development Only) */}
      {process.env.NODE_ENV === 'development' && transactions.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Debug Section</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Transactions:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{transactions.length}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">First Transaction Fields:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {transactions[0] ? Object.keys(transactions[0]).join(', ') : 'None'}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                  {address}
                </span>
              </div>
            </div>
            
            {transactions[0] && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">First Transaction Raw Data:</span>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                    {JSON.stringify(transactions[0], null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionListPage
