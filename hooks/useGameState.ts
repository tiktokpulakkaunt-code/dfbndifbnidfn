"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { User, GameState } from "@/types"
import { firebaseService } from "@/lib/firebase"
import { gameLogic, GAME_CONFIG } from "@/lib/game-logic"
import { telegram } from "@/lib/telegram"
import { getUrlParameter, parseReferralFromUrl, parseRefAuthFromUrl, debounce } from "@/lib/utils"

const defaultUserData: User = {
  id: "",
  firstName: "User",
  lastName: "",
  avatarUrl: "",
  balance: 0, // DRX balance
  ucBalance: 0, // UC balance
  energyLimit: 500,
  multiTapValue: 1,
  rechargingSpeed: 1,
  tapBotPurchased: false,
  tapBotActive: false,
  bonusClaimed: false,
  pubgId: "",
  totalTaps: 0,
  totalEarned: 0,
  lastJackpotTime: 0,
  referredBy: "",
  referralCount: 0,
  level: 1,
  xp: 0,
  streak: 0,
  combo: 0,
  lastTapTime: 0,
  // Mining specific
  isMining: false,
  miningStartTime: 0,
  lastClaimTime: 0,
  pendingRewards: 0,
  miningRate: GAME_CONFIG.BASE_MINING_RATE,
  minClaimTime: GAME_CONFIG.MIN_CLAIM_TIME,
  settings: {
    sound: true,
    vibration: true,
    notifications: true,
  },
  boosts: {
    miningSpeedLevel: 1,
    claimTimeLevel: 1,
    miningRateLevel: 1,
  },
  missions: {},
  withdrawals: [],
  conversions: [],
  joinedAt: Date.now(),
  lastActive: Date.now(),
  isReturningUser: false,
  dataInitialized: false,
}

export const useGameState = () => {
  const [user, setUser] = useState<User>(defaultUserData)
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    soundEnabled: true,
    vibrationEnabled: true,
    dataLoaded: false,
    saveInProgress: false,
    lastSaveTime: 0,
  })
  const [loading, setLoading] = useState(true)

  // Define the actual save function
  const performSave = useCallback(async () => {
    if (!user.id || !user.authKey) return

    setGameState((prev) => ({ ...prev, saveInProgress: true }))
    try {
      await firebaseService.saveUser(user.id, user)
      setGameState((prev) => ({ ...prev, lastSaveTime: Date.now() }))
    } catch (error) {
      console.error("Failed to save user data:", error)
    } finally {
      setGameState((prev) => ({ ...prev, saveInProgress: false }))
    }
  }, [user])

  // Create a debounced version of the save function
  const debouncedSaveUserData = useCallback(debounce(performSave, 500), [performSave])

  // Initialize user and game
  const initializeGame = useCallback(async () => {
    try {
      telegram.init()
      const telegramUser = telegram.getUser()

      const userId = getUrlParameter("id") || telegramUser?.id?.toString() || "user123"
      const authKey = getUrlParameter("authKey")
      
      if (!authKey) {
        console.error("AuthKey is required")
        return // Stay in loading state
      }
      
      // Validate authentication
      const authResult = await firebaseService.validateAuth(userId, authKey)
      
      if (!authResult.valid && !authResult.isNewUser) {
        console.error("Invalid authentication")
        return // Stay in loading state
      }

      if (authResult.valid && authResult.userData) {
        // Existing user with valid auth
        setUser({ ...defaultUserData, ...authResult.userData, id: userId, isReturningUser: true })
      } else {
        // New user - create account
        const newUser = {
          ...defaultUserData,
          id: userId,
          authKey,
          firstName: telegramUser?.first_name || getUrlParameter("first_name") || "User",
          lastName: telegramUser?.last_name || getUrlParameter("last_name") || "",
          avatarUrl: "",
          isReturningUser: false,
        }

        // Handle referral for new users only
        const refId = parseReferralFromUrl()
        const refAuth = parseRefAuthFromUrl()
        
        if (refId && refId !== userId && refAuth) {
          // Validate referrer's authKey
          const referrerAuth = await firebaseService.validateAuth(refId, refAuth)
          if (referrerAuth.valid) {
            newUser.referredBy = refId
            await firebaseService.processReferral(refId, userId, newUser)
          }
        }

        await firebaseService.saveUser(userId, newUser)
        setUser(newUser)
      }

      setGameState((prev) => ({ ...prev, dataLoaded: true }))
      setLoading(false)
    } catch (error) {
      console.error("Failed to initialize game:", error)
      // Stay in loading state on error
    }
  }, [])

  // Start mining
  const startMining = useCallback(() => {
    if (user.isMining) return { success: false, message: "Already mining!" }

    const now = Date.now()
    const updatedUser = {
      ...user,
      isMining: true,
      miningStartTime: now,
      pendingRewards: 0,
    }

    setUser(updatedUser)
    debouncedSaveUserData()
    telegram.hapticFeedback("success")

    return { success: true, message: "Mining started!" }
  }, [user, debouncedSaveUserData])

  // Claim mining rewards
  const claimMiningRewards = useCallback(() => {
    if (!gameLogic.canClaimMining(user)) {
      telegram.hapticFeedback("error")
      return { success: false, message: "Mining time not reached!" }
    }

    const duration = gameLogic.getMiningDuration(user)
    const { earned, type } = gameLogic.calculateMiningRewards(user, duration)

    const updatedUser = {
      ...user,
      balance: user.balance + earned,
      totalEarned: user.totalEarned + earned,
      isMining: false,
      miningStartTime: 0,
      pendingRewards: 0,
      lastClaimTime: Date.now(),
      xp: user.xp + Math.floor(earned),
    }

    setUser(updatedUser)
    debouncedSaveUserData()
    telegram.hapticFeedback("success")

    return { 
      success: true, 
      earned, 
      type, 
      message: `Claimed ${gameLogic.formatNumber(earned)} DRX!` 
    }
  }, [user, debouncedSaveUserData])

  // Upgrade functions
  const upgradeBoost = useCallback(
    async (boostType: "miningSpeed" | "claimTime" | "miningRate") => {
      const currentLevel = user.boosts[`${boostType}Level` as keyof typeof user.boosts]
      const cost = gameLogic.getBoostCost(boostType, currentLevel)

      if (user.balance < cost) {
        telegram.hapticFeedback("error")
        return { success: false, message: `Need ${gameLogic.formatNumber(cost)} DRX` }
      }

      const updates: Partial<User> = {
        balance: user.balance - cost,
        boosts: { ...user.boosts, [`${boostType}Level`]: currentLevel + 1 },
      }

      switch (boostType) {
        case "miningSpeed":
          updates.miningRate = (user.miningRate || GAME_CONFIG.BASE_MINING_RATE) * 1.2
          break
        case "claimTime":
          updates.minClaimTime = Math.max(30, (user.minClaimTime || GAME_CONFIG.MIN_CLAIM_TIME) - 10)
          break
        case "miningRate":
          updates.miningRate = (user.miningRate || GAME_CONFIG.BASE_MINING_RATE) * 1.5
          break
      }

      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      await firebaseService.saveUser(updatedUser.id, updatedUser)

      telegram.hapticFeedback("success")
      return { success: true, message: `${boostType} upgraded!` }
    },
    [user],
  )

  // Claim welcome bonus
  const claimWelcomeBonus = useCallback(async () => {
    if (user.bonusClaimed) return { success: false, message: "Already claimed" }

    const updatedUser = {
      ...user,
      balance: user.balance + GAME_CONFIG.WELCOME_BONUS,
      totalEarned: user.totalEarned + GAME_CONFIG.WELCOME_BONUS,
      bonusClaimed: true,
      dataInitialized: true,
    }

    setUser(updatedUser)
    await firebaseService.saveUser(updatedUser.id, updatedUser)

    telegram.hapticFeedback("success")
    return { success: true, message: `Claimed ${GAME_CONFIG.WELCOME_BONUS} DRX!` }
  }, [user])

  // Mining interval effect
  useEffect(() => {
    let miningInterval: NodeJS.Timeout | undefined

    if (user.isMining && gameState.dataLoaded) {
      miningInterval = setInterval(() => {
        setUser((prev) => {
          if (!prev.isMining) return prev
          
          const pendingRewards = gameLogic.calculatePendingRewards(prev)
          return {
            ...prev,
            pendingRewards,
          }
        })
      }, 1000) // Update every second
    }

    return () => {
      if (miningInterval) {
        clearInterval(miningInterval)
      }
    }
  }, [user.isMining, gameState.dataLoaded])

  // Initialize on mount
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  return {
    user,
    gameState,
    loading,
    startMining,
    claimMiningRewards,
    upgradeBoost,
    claimWelcomeBonus,
    saveUserData: debouncedSaveUserData,
    setUser,
  }
}