// Fetch metadata from URLs

export interface URLMetadata {
  title: string
  description: string
  image: string | null
}

export async function fetchURLMetadata(url: string): Promise<URLMetadata> {
  try {
    // Use a CORS proxy for development
    // In production, this should be done server-side
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`

    const response = await fetch(proxyUrl)
    const data = await response.json()
    const html = data.contents

    // Parse HTML to extract metadata
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Extract title
    let title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent ||
      url

    // Extract description
    const description =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      ''

    // Extract image
    let image =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
      null

    // Make relative URLs absolute
    if (image && !image.startsWith('http')) {
      const urlObj = new URL(url)
      if (image.startsWith('//')) {
        image = urlObj.protocol + image
      } else if (image.startsWith('/')) {
        image = urlObj.origin + image
      } else {
        image = new URL(image, url).href
      }
    }

    return {
      title: title.trim(),
      description: description.trim(),
      image,
    }
  } catch (error) {
    console.error('Failed to fetch metadata:', error)
    // Return fallback metadata
    try {
      const urlObj = new URL(url)
      return {
        title: urlObj.hostname,
        description: '',
        image: null,
      }
    } catch {
      return {
        title: url,
        description: '',
        image: null,
      }
    }
  }
}
