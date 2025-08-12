import React, { useEffect, useState } from 'react'
import { Network, Server, Activity, Hash, Clock, Users, Settings, Save, X, AlertTriangle } from 'lucide-react'
import { NetworkInfo } from '@blockchain-explorer/shared'
import { getNetworkInfo, getRpcEndpoint, changeRpcEndpoint } from '../services/api'
import EraTimer from '../components/EraTimer'

const NetworkPage: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rpcEndpoint, setRpcEndpoint] = useState<string>('')
  const [isEditingRpc, setIsEditingRpc] = useState(false)
  const [newRpcEndpoint, setNewRpcEndpoint] = useState('')
  const [isChangingRpc, setIsChangingRpc] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch both network info and RPC endpoint
        const [info, rpc] = await Promise.all([
          getNetworkInfo(),
          getRpcEndpoint()
        ])
        
        setNetworkInfo(info)
        setRpcEndpoint(rpc.rpcEndpoint)
        setNewRpcEndpoint(rpc.rpcEndpoint)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch network info')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading network information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  const handleRpcChange = async () => {
    if (!newRpcEndpoint.trim()) return
    
    try {
      setIsChangingRpc(true)
      await changeRpcEndpoint(newRpcEndpoint.trim())
      setRpcEndpoint(newRpcEndpoint.trim())
      setIsEditingRpc(false)
      // Refresh network info after RPC change
      const info = await getNetworkInfo()
      setNetworkInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change RPC endpoint')
    } finally {
      setIsChangingRpc(false)
    }
  }

  const cancelRpcEdit = () => {
    setNewRpcEndpoint(rpcEndpoint)
    setIsEditingRpc(false)
  }

  if (!networkInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Network information not available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Network Information</h1>
        <p className="text-gray-600">Real-time blockchain network status and statistics</p>
      </div>

      {/* Network Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="flex items-center justify-center mb-4">
            <Hash className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest Block</h3>
          <p className="text-3xl font-bold text-primary-600">{networkInfo.latestBlock.toLocaleString()}</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Network</h3>
          <p className="text-xl text-gray-900">{networkInfo.chain}</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-4">
            <Server className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Node</h3>
          <p className="text-sm text-gray-600">{networkInfo.nodeName}</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Peers</h3>
          <p className="text-3xl font-bold text-purple-600">{networkInfo.peers}</p>
        </div>
      </div>

      {/* Era Timer */}
      {networkInfo.currentEra !== undefined && (
        <div className="flex justify-center">
          <EraTimer
            currentEra={networkInfo.currentEra}
            currentBlockInEra={networkInfo.currentBlockInEra}
            blocksRemainingInEra={networkInfo.blocksRemainingInEra}
            timeRemainingInEra={networkInfo.timeRemainingInEra}
            eraProgressPercentage={networkInfo.eraProgressPercentage}
            blocksPerEra={networkInfo.blocksPerEra}
            blockTime={networkInfo.blockTime}
          />
        </div>
      )}

      {/* Detailed Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary-600" />
            Network Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Network Name</label>
              <p className="text-lg text-gray-900">{networkInfo.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Chain Type</label>
              <p className="text-lg text-gray-900">{networkInfo.chain}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Node Version</label>
              <p className="text-lg text-gray-900">{networkInfo.nodeVersion}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-600" />
            Status
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Connection Status</label>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Connected</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
              <p className="text-lg text-gray-900">{new Date().toLocaleString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">API Version</label>
              <p className="text-lg text-gray-900">{networkInfo.version}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Information</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">RPC Endpoint</label>
              {isEditingRpc ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newRpcEndpoint}
                    onChange={(e) => setNewRpcEndpoint(e.target.value)}
                    className="flex-1 text-sm font-mono bg-white border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="wss://rpc.example.com"
                  />
                  <button
                    onClick={handleRpcChange}
                    disabled={isChangingRpc}
                    className="btn-primary px-3 py-1 text-sm"
                  >
                    {isChangingRpc ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={cancelRpcEdit}
                    className="btn-secondary px-3 py-1 text-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono text-gray-900">
                    {rpcEndpoint}
                  </code>
                  <button
                    onClick={() => setIsEditingRpc(true)}
                    className="text-primary-600 hover:text-primary-700"
                    title="Edit RPC endpoint"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Protocol</label>
              <p className="text-sm text-gray-900">WebSocket (Substrate)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Era Information */}
      {networkInfo.currentEra !== undefined && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-600" />
            Era Information
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Current Era</div>
              <div className="text-2xl font-bold text-blue-900">{networkInfo.currentEra}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-800">Active Era</div>
              <div className="text-2xl font-bold text-green-900">{networkInfo.activeEra}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-800">Block Time</div>
              <div className="text-2xl font-bold text-purple-900">{networkInfo.blockTime}s</div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 mb-2">⚠️ Testing Mode Limitations</div>
            <div className="text-sm text-yellow-700">
              <p><strong>Era Duration:</strong> {networkInfo.eraDuration} minutes ({networkInfo.blocksPerEra} blocks)</p>
              <p><strong>Note:</strong> This is a testing environment. For production use, implement proper indexing.</p>
            </div>
          </div>
        </div>
      )}

      {/* Block Range Coverage Warnings */}
      {networkInfo.blockRangeCoverage && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-primary-600" />
            Search Coverage Warnings
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="text-sm font-medium text-red-800 mb-1">1000 Blocks</div>
              <div className="text-sm text-red-700">{networkInfo.blockRangeCoverage.blocks1000.warning}</div>
              <div className="text-xs text-gray-600 mt-1">Covers {networkInfo.blockRangeCoverage.blocks1000.timeCoverage}</div>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="text-sm font-medium text-orange-800 mb-1">5000 Blocks (Event Search)</div>
              <div className="text-sm text-orange-700">{networkInfo.blockRangeCoverage.blocks5000.warning}</div>
              <div className="text-xs text-gray-600 mt-1">Covers {networkInfo.blockRangeCoverage.blocks5000.timeCoverage}</div>
              <div className="text-xs text-orange-600 mt-1">⚠️ Fast extrinsic search limit</div>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <div className="text-sm font-medium text-yellow-800 mb-1">10000 Blocks</div>
              <div className="text-sm text-yellow-700">{networkInfo.blockRangeCoverage.blocks10000.warning}</div>
              <div className="text-xs text-gray-600 mt-1">Covers {networkInfo.blockRangeCoverage.blocks10000.timeCoverage}</div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm font-medium text-green-800 mb-1">50000 Blocks</div>
              <div className="text-sm text-green-700">{networkInfo.blockRangeCoverage.blocks50000.warning}</div>
              <div className="text-xs text-gray-600 mt-1">Covers {networkInfo.blockRangeCoverage.blocks50000.timeCoverage}</div>
              <div className="text-xs text-green-600 mt-1">✅ Recommended for testing</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkPage
