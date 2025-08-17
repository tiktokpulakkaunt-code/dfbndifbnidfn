import { initializeApp, getApps, getApp } from "firebase/app"
import { getDatabase, ref, set, get, update, push } from "firebase/database"
import type { WalletCategory } from "@/types"

const firebaseConfig = {
  apiKey: "AIzaSyCEREULVgN4HHnilztiKtCt0TrXGlHLiH8",
  authDomain: "rountenote.firebaseapp.com",
  databaseURL: "https://rountenote-default-rtdb.firebaseio.com",
  projectId: "rountenote",
  storageBucket: "rountenote.firebasestorage.app",
  messagingSenderId: "468968349508",
  appId: "1:468968349508:web:10118a57a2c90e8fa70111",
  measurementId: "G-9ZBMKW473G",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const database = getDatabase(app)

export const firebaseService = {
  database,

  // Validate user authentication
  async validateAuth(userId: string, authKey: string) {
    try {
      const snapshot = await get(ref(database, `users/${userId}`))
      const userData = snapshot.val()
      
      if (!userData || !userData.authKey) {
        return { valid: false, isNewUser: true }
      }
      
      return { 
        valid: userData.authKey === authKey, 
        isNewUser: false,
        userData 
      }
    } catch (error) {
      console.error("Error validating auth:", error)
      return { valid: false, isNewUser: false }
    }
  },

  // Get bot token dynamically from Firebase
  async getBotToken() {
    try {
      const snapshot = await get(ref(database, "config/botToken"))
      return snapshot.val() || "7270345128:AAEuRX7lABDMBRh6lRU1d-4aFzbiIhNgOWE"
    } catch (error) {
      console.error("Error getting bot token:", error)
      return "7270345128:AAEuRX7lABDMBRh6lRU1d-4aFzbiIhNgOWE"
    }
  },

  // Get bot username dynamically from Firebase
  async getBotUsername() {
    try {
      const snapshot = await get(ref(database, "config/botUsername"))
      return snapshot.val() || "UCCoinUltraBot"
    } catch (error) {
      console.error("Error getting bot username:", error)
      return "UCCoinUltraBot"
    }
  },

  // Get wallet categories dynamically from Firebase
  async getWalletCategories(): Promise<WalletCategory[]> {
    try {
      const snapshot = await get(ref(database, "wallet/categories"))
      const categories = snapshot.val()

      if (categories) {
        return Object.values(categories).filter((cat: any) => cat.active)
      }

      return []
    } catch (error) {
      console.error("Error getting wallet categories:", error)
      return []
    }
  },

  // User operations
  async saveUser(userId: string, userData: any) {
    try {
      if (!userData.authKey) {
        throw new Error("AuthKey is required")
      }
      
      await set(ref(database, `users/${userId}`), {
        ...userData,
        lastActive: Date.now(),
        status: "active",
        dataInitialized: true,
      })
      return true
    } catch (error) {
      console.error("Error saving user:", error)
      return false
    }
  },

  async getUser(userId: string) {
    try {
      const snapshot = await get(ref(database, `users/${userId}`))
      return snapshot.val()
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  },

  // Mission operations
  async getMissions() {
    try {
      const snapshot = await get(ref(database, "missions"))
      return snapshot.val() || {}
    } catch (error) {
      console.error("Error getting missions:", error)
      return {}
    }
  },

  async getUserMissions(userId: string) {
    try {
      const snapshot = await get(ref(database, `userMissions/${userId}`))
      return snapshot.val() || {}
    } catch (error) {
      console.error("Error getting user missions:", error)
      return {}
    }
  },

  async updateUserMission(userId: string, missionId: string, missionData: any) {
    try {
      await set(ref(database, `userMissions/${userId}/${missionId}`), missionData)
      return true
    } catch (error) {
      console.error("Error updating user mission:", error)
      return false
    }
  },

  // Referral operations
  async getReferralData(userId: string) {
    try {
      const snapshot = await get(ref(database, `referrals/${userId}`))
      return snapshot.val() || { count: 0, totalUC: 0, referrals: {} }
    } catch (error) {
      console.error("Error getting referral data:", error)
      return { count: 0, totalUC: 0, referrals: {} }
    }
  },

  async getLeaderboard() {
    try {
      const [referralsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(database, "referrals")),
        get(ref(database, "users")),
      ])

      const referralsData = referralsSnapshot.val() || {}
      const users = usersSnapshot.val() || {}

      const leaderboardData = Object.entries(referralsData)
        .map(([id, data]: [string, any]) => ({
          id,
          count: data.count || 0,
          earned: data.totalUC || 0,
          user: users[id] || {},
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 100)

      return leaderboardData
    } catch (error) {
      console.error("Error getting leaderboard:", error)
      return []
    }
  },

  async processReferral(refId: string, userId: string, userData: any) {
    try {
      const referrerSnapshot = await get(ref(database, `users/${refId}`))
      const referrerData = referrerSnapshot.val()
      
      if (!referrerData || !referrerData.authKey) {
        console.log("Invalid referrer or missing authKey")
        return false
      }
      
      const refSnapshot = await get(ref(database, `referrals/${refId}`))
      const refData = refSnapshot.val() || { referrals: {} }

      if (refData.referrals && refData.referrals[userId]) {
        return false
      }

      const newReferralData = {
        count: (refData.count || 0) + 1,
        totalUC: (refData.totalUC || 0) + 500, // Changed to 500 DRX
        referrals: {
          ...(refData.referrals || {}),
          [userId]: {
            date: new Date().toISOString(),
            earned: 500, // Changed to 500 DRX
            firstName: userData.firstName,
            lastName: userData.lastName || "",
            avatarUrl: userData.avatarUrl || "",
          },
        },
      }

      await set(ref(database, `referrals/${refId}`), newReferralData)

      // Update referrer's balance
      if (referrerData) {
        await update(ref(database, `users/${refId}`), {
          balance: (referrerData.balance || 0) + 500, // Changed to 500 DRX
          referralCount: (referrerData.referralCount || 0) + 1,
          totalEarned: (referrerData.totalEarned || 0) + 500, // Changed to 500 DRX
        })
      }

      return true
    } catch (error) {
      console.error("Error processing referral:", error)
      return false
    }
  },

  // Conversion operations
  async createConversion(userId: string, conversionData: any) {
    try {
      const conversionsRef = ref(database, `conversions/${userId}`)
      const newConversionRef = push(conversionsRef)
      
      await set(newConversionRef, {
        ...conversionData,
        id: newConversionRef.key,
        requestedAt: Date.now(),
        status: "pending",
      })

      return newConversionRef.key
    } catch (error) {
      console.error("Error creating conversion:", error)
      return null
    }
  },

  // Telegram verification
  async verifyTelegramMembership(userId: string, channelId: string) {
    try {
      let apiData = ""
      
      if (channelId.startsWith("@")) {
        apiData = btoa(`${channelId}|${userId}`)
      } else if (channelId.startsWith("-100") || /^\d+$/.test(channelId)) {
        const fullChannelId = channelId.startsWith("-100") ? channelId : `-100${channelId}`
        apiData = btoa(`${fullChannelId}|${userId}`)
      } else {
        apiData = btoa(`@${channelId}|${userId}`)
      }

      const response = await fetch(
        `https://m5576.myxvest.ru/davronovapi/api.php?data=${apiData}`
      )
      const result = await response.text()
      
      return result.toLowerCase().trim() === "yes"
    } catch (error) {
      console.error("Error verifying membership:", error)
      return false
    }
  },

  async getGlobalLeaderboard() {
    try {
      const snapshot = await get(ref(database, "users"))
      const users = snapshot.val() || {}

      return Object.entries(users)
        .map(([id, userData]: [string, any]) => ({
          id,
          firstName: userData.firstName || "User",
          lastName: userData.lastName || "",
          avatarUrl: userData.avatarUrl || "",
          totalEarned: userData.totalEarned || 0,
        }))
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 100)
    } catch (error) {
      console.error("Error getting global leaderboard:", error)
      return []
    }
  },
}