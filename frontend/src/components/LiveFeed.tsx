import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Hash, Clock, ArrowUpRight, ArrowDownLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface LiveBlock {
  number: number
  hash: string
  extrinsicsCount: number
  eventsCount: number
  timestamp: number
}

interface LiveExtrinsic {
  blockNumber: number
  index: number
  hash: string
  section: string
  method: string
  signer: string
  success: boolean
  timestamp: number
}

const LiveFeed: React.FC = () => {
  const [blocks, setBlocks] = useState<LiveBlock[]>([])
  const [extrinsics, setExtrinsics] = useState<LiveExtrinsic[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Connect to our backend WebSocket server
        const wsUrl = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:3001'
        console.log('Attempting to connect to WebSocket at:', wsUrl)
        setDebugInfo(`Connecting to ${wsUrl}...`)
        
        const socket = io(`${wsUrl}/blockchain`, {
          transports: ['websocket'],
          timeout: 10000,
        })
        
        socketRef.current = socket

        socket.on('connect', () => {
          console.log('Connected to backend WebSocket server')
          setDebugInfo('Connected to WebSocket server')
          setIsConnected(true)
          setConnectionError(null)
          
          // Join the blocks and transactions rooms
          socket.emit('join:blocks')
          socket.emit('join:transactions')
        })

        socket.on('disconnect', () => {
          console.log('Disconnected from WebSocket server')
          setDebugInfo('Disconnected from WebSocket server')
          setIsConnected(false)
        })

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error)
          setDebugInfo(`Connection error: ${error.message}`)
          setConnectionError('Failed to connect to WebSocket server')
          setIsConnected(false)
        })

        // Listen for blockchain events
        socket.on('blockchain:newBlock', (blockData) => {
          console.log('New block received:', blockData)
          setDebugInfo(`New block received: #${blockData.blockNumber}`)
          const newBlock: LiveBlock = {
            number: blockData.blockNumber,
            hash: blockData.blockHash,
            extrinsicsCount: 0, // Will be updated when blockDetails arrives
            eventsCount: 0,
            timestamp: new Date(blockData.timestamp).getTime()
          }
          
          setBlocks(prev => {
            const existing = prev.find(b => b.number === newBlock.number)
            if (!existing) {
              return [newBlock, ...prev.slice(0, 5)]
            }
            return prev
          })
        })

        socket.on('blockchain:blockDetails', (blockData) => {
          console.log('Block details received:', blockData)
          setDebugInfo(`Block details received: #${blockData.blockNumber}`)
          setBlocks(prev => prev.map(block => 
            block.number === blockData.blockNumber 
              ? { ...block, extrinsicsCount: blockData.extrinsicsCount }
              : block
          ))
        })

        socket.on('blockchain:newTransaction', (transactionData) => {
          console.log('New transaction received:', transactionData)
          setDebugInfo(`New transaction received: ${transactionData.extrinsicHash}`)
          const newExtrinsic: LiveExtrinsic = {
            blockNumber: transactionData.blockNumber,
            index: transactionData.extrinsicIndex,
            hash: transactionData.extrinsicHash,
            section: transactionData.section,
            method: transactionData.method,
            signer: transactionData.signer || 'N/A',
            success: true, // We'll determine this from events if needed
            timestamp: new Date(transactionData.timestamp).getTime()
          }
          
          setExtrinsics(prev => {
            const existing = prev.find(e => e.hash === newExtrinsic.hash)
            if (!existing) {
              return [newExtrinsic, ...prev.slice(0, 5)]
            }
            return prev
          })
        })

        socket.on('blockchain:status', (status) => {
          console.log('Blockchain status:', status)
          setDebugInfo(`Status: connected=${status.connected}, monitoring=${status.monitoring}`)
          setIsConnected(status.connected)
        })

        socket.on('room:joined', (data) => {
          console.log('Joined room:', data.room)
          setDebugInfo(`Joined room: ${data.room}`)
        })

        // Handle reconnection
        socket.on('disconnect', () => {
          console.log('WebSocket disconnected, attempting to reconnect...')
          setIsConnected(false)
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
        })

      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        setConnectionError('Failed to connect to WebSocket server')
        setIsConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    
    // Clear current data and wait for new events
    setBlocks([])
    setExtrinsics([])
    
    // Reconnect to get fresh data
    if (socketRef.current) {
      socketRef.current.disconnect()
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect()
        }
        setIsRefreshing(false)
      }, 1000)
    } else {
      setIsRefreshing(false)
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
    if (seconds < 60) return `${seconds} secs ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      {/* Professional Header with Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Network Activity</h2>
            <p className="text-gray-600 mt-1">Real-time blockchain monitoring and statistics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={() => {
                if (socketRef.current) {
                  socketRef.current.connect()
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Connect
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/websocket/monitoring/start', { method: 'POST' })
                  const result = await response.json()
                  if (result.success) {
                    setDebugInfo('Monitoring started on backend')
                  } else {
                    setDebugInfo(`Failed to start monitoring: ${result.error}`)
                  }
                } catch (error) {
                  setDebugInfo(`Error starting monitoring: ${error}`)
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Start Monitoring
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/websocket/monitoring/status')
                  const result = await response.json()
                  setDebugInfo(`Status: monitoring=${result.isMonitoring}, connected=${result.isBlockchainConnected}`)
                } catch (error) {
                  setDebugInfo(`Error checking status: ${error}`)
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Check Status
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/search/address?address=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
                  const result = await response.json()
                  setDebugInfo(`API accessible: ${result.total} transactions found`)
                } catch (error) {
                  setDebugInfo(`API not accessible: ${error}`)
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Test API
            </button>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Hash className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Blocks</p>
                <p className="text-2xl font-bold text-blue-900">{blocks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Extrinsics</p>
                <p className="text-2xl font-bold text-green-900">{extrinsics.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Block Time</p>
                <p className="text-2xl font-bold text-purple-900">~5s</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Status</p>
                <p className="text-2xl font-bold text-orange-900">{isConnected ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-800 text-sm font-mono">
              Debug: {debugInfo}
            </span>
          </div>
        </div>
      )}

      {/* Activity Status */}
      {isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 text-sm font-medium">
              Live blockchain monitoring active • New blocks every ~5 seconds
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Blocks - Professional Design */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Latest Blocks</h3>
                  <p className="text-sm text-gray-600">Real-time block production</p>
                </div>
              </div>
              <Link 
                to="/blocks" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {blocks.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {isConnected ? 'Waiting for new blocks...' : 'Connecting to blockchain...'}
                </p>
                <p className="text-gray-400 text-sm mt-1">New blocks appear here automatically</p>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">#{block.number}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/block/${block.number}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {formatHash(block.hash)}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>{block.extrinsicsCount} Extrinsics</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>{block.eventsCount} Events</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono">{getTimeAgo(block.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Extrinsics - Professional Design */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Latest Extrinsics</h3>
                  <p className="text-sm text-gray-600">Real-time transaction activity</p>
                </div>
              </div>
              <Link 
                to="/transfers" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {extrinsics.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {isConnected ? 'Waiting for new extrinsics...' : 'Connecting to blockchain...'}
                </p>
                <p className="text-gray-400 text-sm mt-1">New transactions appear here automatically</p>
              </div>
            ) : (
              extrinsics.map((extrinsic, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 font-bold text-xs">
                            {extrinsic.blockNumber}-{extrinsic.index}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/extrinsic/${extrinsic.hash}`}
                          className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                        >
                          {formatHash(extrinsic.hash)}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <span className="font-mono">{extrinsic.section}.{extrinsic.method}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="text-gray-400">•</span>
                            <span>{formatAddress(extrinsic.signer)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {extrinsic.success ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-500 font-mono">{getTimeAgo(extrinsic.timestamp)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-500 font-mono">{getTimeAgo(extrinsic.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-800 font-medium">Connection Error: {connectionError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveFeed
