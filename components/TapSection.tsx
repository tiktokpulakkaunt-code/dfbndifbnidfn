"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import type { User } from "@/types"
import { gameLogic } from "@/lib/game-logic"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface TapSectionProps {
  user: User
  onTap: (event?: React.MouseEvent | React.TouchEvent) => any
  onOpenRank: () => void
}

export const TapSection = ({ user, onTap, onOpenRank }: TapSectionProps) => {
  const [tapEffects, setTapEffects] = useState<
    Array<{ id: number; x: number; y: number; amount: number; type: string }>
  >([])
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const effectIdRef = useRef(0)
  const { toast } = useToast()

  const energyPercentage = (user.tapsLeft / user.energyLimit) * 100
  const { rank, icon } = gameLogic.calculateRank(user.totalEarned)

  const handleTapStart = useCallback(() => {
    setIsPressed(true)
  }, [])

  const handleTapEnd = useCallback(() => {
    setIsPressed(false)
  }, [])

  const handleTap = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Remove preventDefault to avoid passive event listener warning

      const result = onTap(event)

      if (result?.success) {
        // Show toast for special taps
        if (result.type === "critical") {
          toast({
            title: "🔥 Critical Hit!",
            description: `+${gameLogic.formatNumber(result.earned)} UC`,
            duration: 2000,
          })
        } else if (result.type === "jackpot") {
          toast({
            title: "🎰 JACKPOT!",
            description: `Amazing! +${gameLogic.formatNumber(result.earned)} UC`,
            duration: 3000,
          })
        }

        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          let clientX, clientY

          if ("clientX" in event) {
            clientX = event.clientX
            clientY = event.clientY
          } else if (event.touches && event.touches[0]) {
            clientX = event.touches[0].clientX
            clientY = event.touches[0].clientY
          } else {
            clientX = rect.left + rect.width / 2
            clientY = rect.top + rect.height / 2
          }

          const x = clientX - rect.left
          const y = clientY - rect.top

          const effect = {
            id: effectIdRef.current++,
            x,
            y,
            amount: result.earned,
            type: result.type,
          }

          setTapEffects((prev) => [...prev, effect])

          setTimeout(() => {
            setTapEffects((prev) => prev.filter((e) => e.id !== effect.id))
          }, 1000)
        }
      }
    },
    [onTap],
  )

  return (
    <>
      {/* Responsive Header for larger screens */}
      <div className="hidden min-h-[800px]:block lg:min-h-[900px]:block">
        <div className="flex items-center gap-2 mb-4 px-4">
          {/* Rank Button */}
          <button
            onClick={onOpenRank}
            className="relative bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl p-3 lg:p-4 hover:border-yellow-500/60 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-500/40 group overflow-hidden flex flex-col items-center justify-center min-w-[60px] lg:min-w-[80px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20 animate-pulse" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" />

            <div className="relative text-center">
              <div className="text-xl lg:text-2xl mb-1 animate-bounce">{icon}</div>
              <div className="text-sm lg:text-base text-yellow-400 font-bold bg-black/30 px-2 py-1 rounded-full">#{rank}</div>
            </div>
          </button>

          {/* Enhanced Stats for larger screens */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="bg-black/30 border border-orange-400/30 rounded-xl p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl mb-1">🔥</div>
              <div className="text-orange-400 font-bold text-lg lg:text-xl">{user.combo}</div>
              <div className="text-sm text-gray-300 font-semibold uppercase tracking-wide">COMBO</div>
            </div>

            <div className="bg-black/30 border border-blue-400/30 rounded-xl p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl mb-1">⚡</div>
              <div className="text-blue-400 font-bold text-lg lg:text-xl">{user.streak}</div>
              <div className="text-sm text-gray-300 font-semibold uppercase tracking-wide">STREAK</div>
            </div>
          </div>
        </div>
      </div>

      {/* Original compact header for smaller screens */}
      <div className="block min-h-[800px]:hidden lg:min-h-[900px]:hidden pb-4">

        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
          {/* Main Tap Area - Responsive padding and sizing */}
          <div className="flex-1 flex flex-col items-center justify-start pt-[4vh] sm:pt-[6vh] md:pt-[8vh] lg:pt-[10vh] xl:pt-[12vh] px-1 sm:px-3 py-2 sm:py-4 md:py-6 lg:py-9 xl:py-11">
            {/* Coin Container - Scales significantly larger on 800px+ screens */}
        <div className="relative mb-4 sm:mb-6 md:mb-8 lg:mb-14 xl:mb-16" ref={containerRef}>
          <div
            className={`relative w-[75vw] h-[75vw] max-w-[300px] max-h-[300px] sm:max-w-[380px] sm:max-h-[380px] md:max-w-[500px] md:max-h-[500px] lg:max-w-[700px] lg:max-h-[700px] xl:max-w-[900px] xl:max-h-[900px] 2xl:max-w-[1100px] 2xl:max-h-[1100px] mx-auto cursor-pointer transition-transform duration-200 group ${
              isPressed ? "scale-95" : "hover:scale-105"
            }`}
            onClick={handleTap}
            onTouchStart={(e) => {
              handleTapStart()
              handleTap(e)
            }}
            onTouchEnd={handleTapEnd}
            onMouseDown={handleTapStart}
            onMouseUp={handleTapEnd}
            onMouseLeave={handleTapEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Aura Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/15 via-cyan-400/15 to-indigo-400/15 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-indigo-400/20 rounded-full animate-ping" />

            {/* Main Coin Container */}
            <div className="relative z-10 w-full h-full bg-gradient-to-br from-teal-400/25 to-cyan-400/25 rounded-full border-4 border-teal-400/50 shadow-2xl shadow-teal-400/50 flex items-center justify-center overflow-hidden backdrop-blur-md">
              {/* Inner Glow */}
              <div className="absolute inset-4 bg-gradient-to-br from-teal-300/15 to-cyan-300/15 rounded-full animate-pulse" />

              {/* Coin Image - 800px dan uzun ekranlarda kattalashadi */}
              <div className={`relative z-20 transition-transform duration-200 flex items-center justify-center w-full h-full ${isPressed ? "scale-90" : ""}`}>
                <Image
                  src="/images/uc-coin.png"
                  alt="UC Coin"
                  width={600}
                  height={600}
                  className="w-[85%] h-[85%] sm:w-[90%] sm:h-[90%] md:w-[95%] md:h-[95%] lg:w-[100%] lg:h-[100%] xl:w-[105%] xl:h-[105%] 2xl:w-[110%] 2xl:h-[110%] object-contain drop-shadow-2xl"
                  priority
                  quality={80}
                />
              </div>

              {/* Tap Ripple Effect */}
              <div
                className={`absolute inset-0 rounded-full border-4 border-white/25 transition-all duration-200 ${
                  isPressed ? "scale-100 opacity-0" : "scale-0 opacity-70"
                }`}
              />
            </div>

            {/* Tap Effects - 800px dan uzun ekranlarda kattalashadi */}
            {tapEffects.map((effect) => (
              <div
                key={effect.id}
                className={`absolute pointer-events-none z-30 font-bold select-none ${
                  effect.type === "critical"
                    ? "text-red-300 text-base sm:text-lg md:text-xl lg:text-3xl xl:text-4xl drop-shadow-lg animate-bounce-up-critical font-extrabold lg:font-black xl:font-black"
                    : effect.type === "jackpot"
                    ? "text-green-300 text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl drop-shadow-xl animate-bounce-up-jackpot font-extrabold lg:font-black xl:font-black"
                    : "text-orange-300 text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl drop-shadow-md animate-bounce-up font-extrabold lg:font-black xl:font-black"
                }`}
                style={{
                  left: effect.x,
                  top: effect.y,
                  transform: "translate(-50%, -50%)",
                  textShadow: "0 0 12px currentColor",
                }}
              >
                +{gameLogic.formatNumber(effect.amount)}
                {effect.type === "jackpot" && " 🎰"}
                {effect.type === "critical" && " 🔥"}
              </div>
            ))}

            {/* Floating Particles - 800px dan uzun ekranlarda kattalashadi */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 lg:w-4 lg:h-4 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-ping opacity-25"
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${15 + i * 20}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>

            {/* Tap Instruction with Rank Button - Responsive width and spacing */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-10 2xl:gap-14 w-[85%] sm:w-[80%] md:w-[75%] lg:w-[70%] xl:w-[65%] z-10 justify-between">
          {/* Rank Button */}
          <button
            onClick={onOpenRank}
            aria-label={`View rank ${rank}`}
            className="flex-1 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border-2 border-yellow-400/50 rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-5 xl:p-7 2xl:p-9 hover:border-yellow-400/70 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-400/40 group overflow-hidden"
          >
            <div className="text-center">
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-2 xl:mb-2.5 2xl:mb-3 animate-bounce font-extrabold">{icon}</div>
              <div className="text-[0.6rem] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-yellow-300 font-extrabold">#{rank}</div>
            </div>
          </button>

          {/* Tap Instruction */}
          <div className="flex-1 bg-gradient-to-r from-black/40 to-gray-800/40 backdrop-blur-md border-2 border-teal-400/50 rounded-xl px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-1.5 sm:py-2 md:py-2.5 lg:py-4 xl:py-5 2xl:py-6 shadow-lg shadow-teal-400/30 z-10">
            <p className="text-teal-300 font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 font-extrabold justify-center">
              <span className="animate-bounce text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">👆</span>
              <span>Tap to Mine UC!</span>
              <span className="animate-pulse text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">💎</span>
            </p>
          </div>
        </div>

            {/* Energy System - Positioned at bottom with responsive spacing */}
            <div className="relative mx-1 sm:mx-2 md:mx-4 lg:mx-6 xl:mx-8 2xl:mx-10 mt-4 sm:mt-6 md:mt-8 lg:mt-16 xl:mt-24 2xl:mt-32 bg-gradient-to-r from-black/40 to-gray-800/40 backdrop-blur-md border-2 border-teal-400/50 rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 2xl:p-10 w-[calc(100%-0.5rem)] sm:w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] lg:w-[calc(100%-3rem)] xl:w-[calc(100%-4rem)] 2xl:w-[calc(100%-5rem)] max-w-[500px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] xl:max-w-[900px] 2xl:max-w-[1000px] min-h-[70px] sm:min-h-[80px] md:min-h-[90px] lg:min-h-[110px] xl:min-h-[130px] 2xl:min-h-[150px] z-20">
              <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 2xl:mb-7">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-7">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-xl flex items-center justify-center text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl shadow-lg overflow-hidden font-extrabold">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-400/25 to-yellow-400/25 animate-pulse" />
                <span className="relative">⚡</span>
              </div>
              <div>
                    <p className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-display font-extrabold">
                  {user.tapsLeft} / {user.energyLimit}
                </p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-200 font-semibold uppercase tracking-wide font-extrabold">Energy</p>
              </div>
            </div>
            <div className="text-right">
                <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-yellow-300 drop-shadow-lg font-display font-extrabold">
                {Math.round(energyPercentage)}%
              </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-300 font-extrabold">Charged</div>
            </div>
          </div>

              {/* Progress Bar - Scales with screen size */}
              <div className="relative w-full h-2 sm:h-2.5 md:h-3 lg:h-4 xl:h-5 2xl:h-6 bg-gray-700 rounded-full overflow-hidden border-2 border-gray-600/40 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-yellow-400/70 via-orange-400/70 to-red-400/70 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${energyPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>

            {energyPercentage > 50 && (
                <div className="absolute top-0.5 left-1/4 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 bg-yellow-300 rounded-full animate-ping" />
            )}
          </div>
        </div>
      </div>
    </div>
        </div>
    </>
  )
}