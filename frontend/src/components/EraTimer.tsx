import React, { useState, useEffect } from 'react'
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react'

interface EraTimerProps {
  currentEra: number
  currentBlockInEra: number
  blocksRemainingInEra: number
  timeRemainingInEra: number
  eraProgressPercentage: number
  blocksPerEra: number
  blockTime: number
}

const EraTimer: React.FC<EraTimerProps> = ({
  currentEra,
  currentBlockInEra,
  blocksRemainingInEra,
  timeRemainingInEra,
  eraProgressPercentage,
  blocksPerEra,
  blockTime
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemainingInEra)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemainingInEra])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage < 30) return 'text-blue-600'
    if (percentage < 70) return 'text-yellow-600'
    if (percentage < 90) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressBgColor = (percentage: number): string => {
    if (percentage < 30) return 'bg-blue-100'
    if (percentage < 70) return 'bg-yellow-100'
    if (percentage < 90) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getProgressRingColor = (percentage: number): string => {
    if (percentage < 30) return 'stroke-blue-600'
    if (percentage < 70) return 'stroke-yellow-600'
    if (percentage < 90) return 'stroke-orange-600'
    return 'stroke-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Era Progress</h3>
            <p className="text-sm text-gray-600">Current Era: {currentEra}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{formatTime(timeLeft)}</div>
          <div className="text-sm text-gray-600">Time Remaining</div>
        </div>
      </div>

      {/* Circular Progress Bar */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
            {/* Background circle */}
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - eraProgressPercentage / 100)}`}
              className={getProgressRingColor(eraProgressPercentage)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getProgressColor(eraProgressPercentage)}`}>
                {Math.round(eraProgressPercentage)}%
              </div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${getProgressBgColor(eraProgressPercentage)}`}>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Progress</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {currentBlockInEra} / {blocksPerEra}
          </div>
          <div className="text-xs text-gray-600">Blocks in Era</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Next Era</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {blocksRemainingInEra}
          </div>
          <div className="text-xs text-gray-600">Blocks Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBgColor(eraProgressPercentage)}`}
            style={{ width: `${eraProgressPercentage}%` }}
          >
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressRingColor(eraProgressPercentage)}`}
              style={{ width: `${eraProgressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Era Information */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Era Information</p>
            <p className="mt-1">
              Each era lasts {blocksPerEra} blocks ({blocksPerEra * blockTime} seconds). 
              The next era will begin in approximately {formatTime(timeLeft)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EraTimer
