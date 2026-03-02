'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/security')
  }, [router])
  return null
}
