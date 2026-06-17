import React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export default function AdminLoader({ size = 256, inline = false }) {
  if (inline) {
    return (
      <div className="flex items-center justify-center p-4">
        <div style={{ width: size, height: size }}>
          <DotLottieReact
            src="https://lottie.host/e11ddac9-19b8-40d3-aee7-9a3bf013247f/VlVJkNYsRm.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-200">
      <div style={{ width: size, height: size }}>
        <DotLottieReact
          src="https://lottie.host/e11ddac9-19b8-40d3-aee7-9a3bf013247f/VlVJkNYsRm.lottie"
          loop
          autoplay
        />
      </div>
      <p className="text-md font-semibold tracking-[0.24em] uppercase text-slate-500 animate-pulse">
        Please wait a while
      </p>
    </div>
  )
}
