import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'

export const GET = withAdminAuth(async (request: NextRequest) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_OWNER = process.env.GITHUB_OWNER
    const GITHUB_REPO = process.env.GITHUB_REPO

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        return NextResponse.json({
            success: false,
            error: 'GitHub configuration missing (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)'
        }, { status: 500 })
    }

    const headers = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    }

    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`

    try {
        // Fetch different types of alerts in parallel
        const [dependabotRes, codeScanRes, secretScanRes] = await Promise.all([
            fetch(`${baseUrl}/dependabot/alerts?state=open&per_page=10`, { headers }),
            fetch(`${baseUrl}/code-scanning/alerts?state=open&per_page=10`, { headers }),
            fetch(`${baseUrl}/secret-scanning/alerts?state=open&per_page=10`, { headers })
        ])

        const [dependabot, codeScanning, secretScanning] = await Promise.all([
            dependabotRes.ok ? dependabotRes.json() : Promise.resolve([]),
            codeScanRes.ok ? codeScanRes.json() : Promise.resolve([]),
            secretScanRes.ok ? secretScanRes.json() : Promise.resolve([])
        ])

        return NextResponse.json({
            success: true,
            data: {
                dependabot: Array.isArray(dependabot) ? dependabot : [],
                codeScanning: Array.isArray(codeScanning) ? codeScanning : [],
                secretScanning: Array.isArray(secretScanning) ? secretScanning : [],
                repository: {
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO
                }
            },
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('GitHub Security API Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
})
