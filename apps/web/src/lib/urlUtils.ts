// URL utility functions

export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  // If it already has a protocol, return as is
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed
  }

  // If it starts with www., add https://
  if (trimmed.match(/^www\./i)) {
    return `https://${trimmed}`
  }

  // If it looks like a domain (has a dot), add https://
  if (trimmed.includes('.')) {
    return `https://${trimmed}`
  }

  return trimmed
}

export function isImageUrl(url: string): boolean {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Check file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
    if (imageExtensions.some(ext => pathname.endsWith(ext))) {
      return true
    }

    // Check common image hosting domains
    const imageHosts = ['i.imgur.com', 'images.unsplash.com', 'cdn.pixabay.com', 'i.redd.it']
    if (imageHosts.some(host => urlObj.hostname.includes(host))) {
      return true
    }

    return false
  } catch {
    return false
  }
}
