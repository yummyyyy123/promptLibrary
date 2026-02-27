// Better authentication check for admin panel
export const isAuthenticated = async () => {
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
  if (typeof window !== 'undefined') {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      window.location.href = '/admin/login'
    }
  }
}
