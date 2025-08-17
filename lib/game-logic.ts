import type { User } from "@/types"

// Updated game config for DRX mining system
export const GAME_CONFIG = {
  REFERRAL_BONUS: 500, // DRX
  BASE_MINING_RATE: 0.001, // DRX per second
  WELCOME_BONUS: 100, // DRX
  JACKPOT_COOLDOWN: 3600000, // 1 hour
  MIN_CLAIM_TIME: 60, // 1 minute minimum mining time
  MAX_MINING_TIME: 86400, // 24 hours maximum mining time
  DAILY_MINING_REWARD: 100, // DRX for 24h continuous mining
  CRITICAL_CHANCE: 0.02,
  JACKPOT_CHANCE: 0.0005,
  MAX_LEVEL: 50,
  XP_PER_LEVEL: 100,
  DRX_TO_UC_RATE: 1, // 1 DRX = 1 UC (can be changed)
}

export const gameLogic = {
  calculateMiningRewards(user: User, miningDuration: number): { earned: number; type: "normal" | "bonus" } {
    const baseRate = user.miningRate || GAME_CONFIG.BASE_MINING_RATE
    let earned = baseRate * miningDuration // duration in seconds
    let type: "normal" | "bonus" = "normal"

    // Bonus for 24h continuous mining
    if (miningDuration >= GAME_CONFIG.MAX_MINING_TIME) {
      earned += GAME_CONFIG.DAILY_MINING_REWARD
      type = "bonus"
    }

    return { earned, type }
  },

  calculateLevel(xp: number): { level: number; currentXP: number; xpForNext: number } {
    let level = 1
    let remainingXP = xp

    while (remainingXP >= this.getXpForLevel(level)) {
      remainingXP -= this.getXpForLevel(level)
      level++
    }

    return {
      level,
      currentXP: remainingXP,
      xpForNext: this.getXpForLevel(level),
    }
  },

  getXpForLevel(level: number): number {
    return 100 * level
  },

  calculateRank(totalEarned: number): { rank: number; title: string; nextRankAt: number; icon: string } {
    const ranks = [
      { threshold: 0, title: "Rookie Miner", icon: "🥉" },
      { threshold: 1000, title: "Bronze Miner", icon: "🥉" },
      { threshold: 5000, title: "Silver Miner", icon: "🥈" },
      { threshold: 15000, title: "Gold Miner", icon: "🥇" },
      { threshold: 50000, title: "Platinum Miner", icon: "💎" },
      { threshold: 150000, title: "Diamond Miner", icon: "💎" },
      { threshold: 500000, title: "Master Miner", icon: "👑" },
      { threshold: 1500000, title: "Grandmaster Miner", icon: "👑" },
      { threshold: 5000000, title: "Legend Miner", icon: "🏆" },
      { threshold: 15000000, title: "Mythical Miner", icon: "⭐" },
      { threshold: 50000000, title: "Ultimate Miner", icon: "🌟" },
    ]

    let currentRank = 1
    let currentTitle = ranks[0].title
    let currentIcon = ranks[0].icon
    let nextRankAt = ranks[1]?.threshold || 0

    for (let i = 0; i < ranks.length; i++) {
      if (totalEarned >= ranks[i].threshold) {
        currentRank = i + 1
        currentTitle = ranks[i].title
        currentIcon = ranks[i].icon
        nextRankAt = ranks[i + 1]?.threshold || ranks[i].threshold
      } else {
        break
      }
    }

    return {
      rank: currentRank,
      title: currentTitle,
      nextRankAt,
      icon: currentIcon,
    }
  },

  getBoostCost(boostType: "miningSpeed" | "claimTime" | "miningRate", currentLevel: number): number {
    const costs = {
      miningSpeed: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      claimTime: [150, 300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 76800],
      miningRate: [200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400],
    }

    const costArray = costs[boostType]
    const index = Math.min(currentLevel - 1, costArray.length - 1)

    if (index < costArray.length) {
      return costArray[index]
    } else {
      return costArray[costArray.length - 1] * Math.pow(2, currentLevel - costArray.length)
    }
  },

  formatNumber(num: number | undefined | null): string {
    const safeNum = typeof num === "number" ? num : 0

    if (safeNum >= 1000000) {
      return (safeNum / 1000000).toFixed(1) + "M"
    } else if (safeNum >= 1000) {
      return (safeNum / 1000).toFixed(1) + "K"
    }
    return safeNum.toFixed(3)
  },

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  },

  canClaimMining(user: User): boolean {
    if (!user.isMining || !user.miningStartTime) return false
    
    const now = Date.now()
    const miningDuration = Math.floor((now - user.miningStartTime) / 1000)
    
    return miningDuration >= (user.minClaimTime || GAME_CONFIG.MIN_CLAIM_TIME)
  },

  getMiningDuration(user: User): number {
    if (!user.isMining || !user.miningStartTime) return 0
    
    const now = Date.now()
    return Math.floor((now - user.miningStartTime) / 1000)
  },

  calculatePendingRewards(user: User): number {
    const duration = this.getMiningDuration(user)
    if (duration === 0) return 0
    
    const { earned } = this.calculateMiningRewards(user, duration)
    return earned
  },
}