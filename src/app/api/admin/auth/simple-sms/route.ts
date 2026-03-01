export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    return Response.json({
      success: true,
      otp: otp,
      message: 'OTP generated'
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
