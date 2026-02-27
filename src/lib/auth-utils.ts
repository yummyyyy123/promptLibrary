// Better authentication check for admin panel
export const isAuthenticated = async () => {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    // Check if we have a valid admin token
    const response = await fetch('/api/admin/auth/check', {
      method: 'GET',
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      return data.authenticated === true
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

// Redirect to login if not authenticated
export const requireAuth = () => {
  const checkAuth = async () => {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      window.location.href = '/admin/login'
    }
  }
  
  checkAuth()
}
