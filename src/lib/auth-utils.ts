// Better authentication check for admin panel
export const isAuthenticated = async () => {
  if (typeof window === 'undefined') {
    console.log('🔍 Window not available')
    return false
  }
  
  try {
    console.log('🔍 Checking authentication...')
    // Check if we have a valid admin token
    const response = await fetch('/api/admin/auth/check', {
      method: 'GET',
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Auth check response:', data)
      return data.authenticated === true
    } else {
      console.log('❌ Auth check failed:', response.status)
      return false
    }
  } catch (error) {
    console.error('💥 Auth check error:', error)
    return false
  }
}

// Redirect to login if not authenticated
export const requireAuth = () => {
  console.log('🔍 requireAuth called')
  const checkAuth = async () => {
    const authenticated = await isAuthenticated()
    console.log('🔍 Authenticated:', authenticated)
    if (!authenticated) {
      console.log('🔄 Redirecting to login...')
      window.location.href = '/admin/login'
      return false
    }
    return true
  }
  
  // Only call once to prevent infinite loops
  let isChecking = false
  return async () => {
    console.log('🔍 Starting auth check, isChecking:', isChecking)
    if (isChecking) {
      console.log('⚠️ Already checking, preventing infinite loop')
      return false
    }
    isChecking = true
    
    try {
      const authenticated = await isAuthenticated()
      isChecking = false
      console.log('🔍 Final authenticated result:', authenticated)
      if (!authenticated) {
        console.log('🔄 Redirecting to login...')
        window.location.href = '/admin/login'
        return false
      }
      return true
    } catch (error) {
      isChecking = false
      console.error('💥 Auth check failed:', error)
      return false
    }
  }
}
