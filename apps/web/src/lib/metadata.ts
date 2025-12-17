// Fetch metadata from URLs using CORS proxy

export interface URLMetadata {
  title: string
  description: string
  image: string | null
}

export async function fetchURLMetadata(url: string): Promise<URLMetadata> {
  console.log('🔍 Starting metadata fetch for:', url)

  try {
    // Use corsproxy.io (same as your working HTML example)
    const proxy = 'https://corsproxy.io/?'
    const target = proxy + encodeURIComponent(url)

    console.log('📡 Fetching from proxy:', target)

    const response = await fetch(target)

    console.log('📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    console.log('📄 HTML received, length:', html.length)

    // Parse HTML using DOMParser (browser API)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    console.log('🔨 HTML parsed successfully')

    // Extract metadata
    const meta: any = {}

    // Basic meta tags
    meta.title = doc.querySelector('title')?.textContent || null
    meta.description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || null

    // OpenGraph tags
    meta.openGraph = {}
    doc.querySelectorAll('meta[property^="og:"]').forEach(tag => {
      const property = tag.getAttribute('property')
      const content = tag.getAttribute('content')
      if (property && content) {
        meta.openGraph[property] = content
      }
    })

    // Twitter card tags
    meta.twitter = {}
    doc.querySelectorAll('meta[name^="twitter:"]').forEach(tag => {
      const name = tag.getAttribute('name')
      const content = tag.getAttribute('content')
      if (name && content) {
        meta.twitter[name] = content
      }
    })

    console.log('📊 Raw metadata extracted:', JSON.stringify(meta, null, 2))

    // Build final result (prefer OpenGraph, fallback to basic meta)
    const result: URLMetadata = {
      title: meta.openGraph['og:title'] || meta.title || url,
      description: meta.openGraph['og:description'] || meta.description || '',
      image: meta.openGraph['og:image'] || meta.twitter['twitter:image'] || null,
    }

    console.log('✅ Final metadata result:', result)

    return result

  } catch (error) {
    console.error('❌ Failed to fetch metadata:', error)

    // Return fallback metadata
    try {
      const urlObj = new URL(url)
      const fallback = {
        title: urlObj.hostname,
        description: '',
        image: null,
      }
      console.log('🔄 Using fallback metadata:', fallback)
      return fallback
    } catch {
      const fallback = {
        title: url,
        description: '',
        image: null,
      }
      console.log('🔄 Using minimal fallback:', fallback)
      return fallback
    }
  }
}
