"use client"

import { Pickaxe, Rocket, Target, Wallet, Users } from "lucide-react"

interface BottomNavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export const BottomNavigation = ({ activeSection, onSectionChange }: BottomNavigationProps) => {
  const navItems = [
    { id: "mining", icon: Pickaxe },
    { id: "boost", icon: Rocket },
    { id: "missions", icon: Target },
    { id: "wallet", icon: Wallet },
    { id: "friends", icon: Users },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t-2 border-green-500/40 p-2 z-50 shadow-2xl shadow-green-500/10">
      <div className="flex justify-around items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 flex-1 max-w-[70px] relative group ${
                isActive
                  ? "text-green-400 bg-green-500/20 border-2 border-green-500/50 shadow-lg shadow-green-500/30 scale-110"
                  : "text-gray-400 hover:text-green-400 hover:scale-105 hover:bg-gray-800/40"
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-1.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse" />
              )}
              <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}