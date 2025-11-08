import { useState, useEffect, useRef } from "react"
import { LoginForm } from "../components/layout/login-form"
import { SignupForm } from "../components/layout/signup-form"

export default function Page() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 修改 Google 为 QQ
    const buttons = containerRef.current.querySelectorAll('button')
    buttons.forEach((button) => {
      if (button.textContent?.includes('Google')) {
        button.textContent = button.textContent.replace('Google', 'QQ')
      }
    })

    // 为 Sign up / Sign in 链接添加点击事件
    const links = containerRef.current.querySelectorAll('a')
    links.forEach((link) => {
      if (link.textContent?.includes('Sign up')) {
        link.addEventListener('click', (e) => {
          e.preventDefault()
          setMode('signup')
        })
      } else if (link.textContent?.includes('Sign in')) {
        link.addEventListener('click', (e) => {
          e.preventDefault()
          setMode('login')
        })
      }
    })
  }, [mode])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm" ref={containerRef}>
        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  )
}
