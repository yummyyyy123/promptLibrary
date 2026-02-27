// Test login functionality
const testLogin = async () => {
  try {
    console.log('🧪 Testing login...')
    
    const response = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'root',
        password: 'r00t'
      })
    })

    const data = await response.json()
    console.log('📊 Login response:', data)
    console.log('📊 Response status:', response.status)
    
    if (response.ok) {
      console.log('✅ Login successful!')
      // Check if cookie was set
      const cookies = response.headers.get('set-cookie')
      console.log('🍪 Cookies set:', cookies)
    } else {
      console.log('❌ Login failed:', data)
    }
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testLogin()
