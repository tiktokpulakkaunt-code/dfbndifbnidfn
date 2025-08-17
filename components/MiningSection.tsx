"use client"

import { useState, useEffect } from "react"
import type { User } from "@/types"
import { gameLogic } from "@/lib/game-logic"
import { Play, Gift, Clock, Zap } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface MiningSectionProps {
  user: User
  onStartMining: () => any
  onClaimRewards: () => any
  onOpenRank: () => void
}

export const MiningSection = ({ user, onStartMining, onClaimRewards, onOpenRank }: MiningSectionProps) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [canClaim, setCanClaim] = useState(false)
  const { toast } = useToast()
  const { rank, icon } = gameLogic.calculateRank(user.totalEarned)

  // Update timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (user.isMining) {
      interval = setInterval(() => {
        const duration = gameLogic.getMiningDuration(user)
        const minTime = user.minClaimTime || 60
        
        if (duration >= minTime) {
          setCanClaim(true)
          setTimeLeft(0)
        } else {
          setCanClaim(false)
          setTimeLeft(minTime - duration)
        }
      }, 1000)
    } else {
      setCanClaim(false)
      setTimeLeft(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user.isMining, user.miningStartTime, user.minClaimTime])

  const handleStartMining = () => {
    const result = onStartMining()
    if (result.success) {
      toast({
        title: "⛏️ Mining Started!",
        description: "DRX mining has begun. Wait for minimum time to claim.",
        duration: 3000,
      })
    }
  }

  const handleClaimRewards = () => {
    const result = onClaimRewards()
    if (result.success) {
      toast({
        title: "🎁 Rewards Claimed!",
        description: `You earned ${gameLogic.formatNumber(result.earned)} DRX!`,
        duration: 3000,
      })
    } else {
      toast({
        title: "⏰ Not Ready Yet",
        description: result.message,
        duration: 3000,
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Header with Rank */}
      <div className="flex items-center gap-2 mb-4 px-4 pt-4">
        <div className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-xl p-3 flex-1 shadow-lg shadow-green-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-xl shadow-lg">
              ⛏️
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">DRX Mining</h2>
              <p className="text-gray-400 text-xs">Earn DRX coins</p>
            </div>
          </div>
        </div>

        {/* Rank Button */}
        <button
          onClick={onOpenRank}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-lg p-2 hover:border-yellow-500/60 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-500/30"
        >
          <div className="text-center">
            <div className="text-lg mb-0.5 animate-bounce">{icon}</div>
            <div className="text-xs text-yellow-400 font-bold">#{rank}</div>
          </div>
        </button>
      </div>

      {/* Main Mining Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Balance Display */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white mb-2 font-display">
            {gameLogic.formatNumber(user.balance)}
          </div>
          <div className="text-green-400 text-xl font-bold">DRX</div>
          <div className="text-gray-400 text-sm mt-2">
            Mining Rate: {gameLogic.formatNumber(user.miningRate || 0.001)} DRX/sec
          </div>
        </div>

        {/* Mining Visual */}
        <div className="relative mb-8">
          <div className="relative w-64 h-64 mx-auto">
            {/* Decorative frame */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full border-4 border-green-500/50 shadow-2xl shadow-green-500/50" />
            
            {/* Mining animation */}
            <div className={`absolute inset-4 bg-gradient-to-br from-green-400/30 to-blue-500/30 rounded-full flex items-center justify-center ${user.isMining ? 'animate-pulse' : ''}`}>
              <div className={`w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-6xl shadow-xl ${user.isMining ? 'animate-spin-slow' : ''}`}>
                ⛏️
              </div>
            </div>

            {/* Pending rewards display */}
            {user.isMining && user.pendingRewards > 0 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                +{gameLogic.formatNumber(user.pendingRewards)} DRX
              </div>
            )}
          </div>
        </div>

        {/* Status and Timer */}
        <div className="text-center mb-8">
          {user.isMining ? (
            <div>
              <div className="text-green-400 font-bold text-lg mb-2">⛏️ Mining Active</div>
              {!canClaim && timeLeft > 0 && (
                <div className="text-orange-400 font-bold">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {gameLogic.formatTime(timeLeft)} until claim
                </div>
              )}
              {canClaim && (
                <div className="text-green-400 font-bold animate-pulse">
                  <Gift className="w-4 h-4 inline mr-2" />
                  Ready to claim!
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400">
              <div className="text-lg mb-2">Mining Stopped</div>
              <div className="text-sm">Start mining to earn DRX</div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="w-full max-w-sm">
          {!user.isMining ? (
            <button
              onClick={handleStartMining}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              <span className="text-lg">Start Mining</span>
            </button>
          ) : (
            <button
              onClick={handleClaimRewards}
              disabled={!canClaim}
              className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${
                canClaim
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white hover:scale-105 animate-pulse"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Gift className="w-6 h-6" />
              <span className="text-lg">
                {canClaim ? "Claim Rewards" : `Wait ${gameLogic.formatTime(timeLeft)}`}
              </span>
            </button>
          )}
        </div>

        {/* Mining Stats */}
        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm">
          <div className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-xl p-3 text-center">
            <div className="text-green-400 font-bold text-lg">{gameLogic.formatNumber(user.totalEarned)}</div>
            <div className="text-gray-400 text-xs uppercase tracking-wide">Total Earned</div>
          </div>
          <div className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-xl p-3 text-center">
            <div className="text-blue-400 font-bold text-lg">{user.level}</div>
            <div className="text-gray-400 text-xs uppercase tracking-wide">Level</div>
          </div>
        </div>
      </div>
    </div>
  )
}