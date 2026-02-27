// Simple, reliable authentication check
export const checkAuthStatus = async () => {
  try {
    const response = await fetch('/api/admin/auth/check', {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      console.log('❌ Auth check failed:', response.status)
      return false
    }
    
    const data = await response.json()
    console.log('✅ Auth check success:', data.authenticated)
    return data.authenticated === true
  } catch (error) {
    console.error('💥 Auth check error:', error)
    return false
  }
}

export const logout = async () => {
  try {
    const response = await fetch('/api/admin/auth', { method: 'DELETE' })
    console.log('🔄 Logout response:', response.ok)
    
    // Force redirect after logout
    if (response.ok) {
      window.location.href = '/admin/login'
    }
  } catch (error) {
    console.error('💥 Logout error:', error)
    window.location.href = '/admin/login'
  }
}
