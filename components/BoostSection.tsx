"use client"

import type { User } from "@/types"
import { gameLogic } from "@/lib/game-logic"
import { ArrowUp, Zap, Clock, TrendingUp } from "lucide-react"

interface BoostSectionProps {
  user: User
  onUpgrade: (boostType: "miningSpeed" | "claimTime" | "miningRate") => Promise<any>
  onOpenRank: () => void
}

export const BoostSection = ({ user, onUpgrade, onOpenRank }: BoostSectionProps) => {
  const miningSpeedCost = gameLogic.getBoostCost("miningSpeed", user.boosts.miningSpeedLevel)
  const claimTimeCost = gameLogic.getBoostCost("claimTime", user.boosts.claimTimeLevel)
  const miningRateCost = gameLogic.getBoostCost("miningRate", user.boosts.miningRateLevel)
  const { rank, icon } = gameLogic.calculateRank(user.totalEarned)

  const boosts = [
    {
      id: "miningSpeed",
      title: "Mining Speed",
      description: "Increase mining efficiency",
      icon: <Zap className="w-6 h-6" />,
      level: user.boosts.miningSpeedLevel,
      current: `${user.boosts.miningSpeedLevel}x`,
      next: `${user.boosts.miningSpeedLevel + 1}x`,
      cost: miningSpeedCost,
      onUpgrade: () => onUpgrade("miningSpeed"),
    },
    {
      id: "claimTime",
      title: "Claim Time",
      description: "Reduce minimum claim time",
      icon: <Clock className="w-6 h-6" />,
      level: user.boosts.claimTimeLevel,
      current: `${user.minClaimTime || 60}s`,
      next: `${Math.max(30, (user.minClaimTime || 60) - 10)}s`,
      cost: claimTimeCost,
      onUpgrade: () => onUpgrade("claimTime"),
    },
    {
      id: "miningRate",
      title: "Mining Rate",
      description: "Increase DRX per second",
      icon: <TrendingUp className="w-6 h-6" />,
      level: user.boosts.miningRateLevel,
      current: `${gameLogic.formatNumber(user.miningRate || 0.001)}/s`,
      next: `${gameLogic.formatNumber((user.miningRate || 0.001) * 1.5)}/s`,
      cost: miningRateCost,
      onUpgrade: () => onUpgrade("miningRate"),
    },
  ]

  return (
    <div className="pb-4">
      {/* Section Header with Rank */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-xl p-3 flex-1 shadow-lg shadow-green-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-xl shadow-lg">
              🚀
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Mining Boosts</h2>
              <p className="text-gray-400 text-xs">Upgrade mining power</p>
            </div>
          </div>
        </div>

        {/* Rank Icon */}
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

      {/* Boost Cards */}
      <div className="space-y-3">
        {boosts.map((boost) => (
          <div
            key={boost.id}
            className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-xl p-4 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                {boost.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white font-display">{boost.title}</h3>
                <p className="text-xs text-gray-400">{boost.description}</p>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Lv.{boost.level}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-black/20 rounded-lg border border-gray-700/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Current</p>
                <p className="text-sm font-bold text-white">{boost.current}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Next Level</p>
                <p className="text-sm font-bold text-green-400">{boost.next}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Cost</p>
                <p className="text-sm font-bold text-orange-400">{gameLogic.formatNumber(boost.cost)} DRX</p>
              </div>
            </div>

            <button
              onClick={boost.onUpgrade}
              disabled={user.balance < boost.cost}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
            >
              <ArrowUp className="w-4 h-4" />
              Upgrade {boost.title}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}