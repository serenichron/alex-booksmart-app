// Location bookmark utilities for detecting and parsing map URLs

export interface LocationData {
  latitude: number
  longitude: number
  locationName?: string
  placeId?: string
  source: 'google_maps' | 'apple_maps' | 'waze' | 'osm' | 'what3words' | 'bing' | 'manual'
  address?: string
}

/**
 * Detects if a URL is a location/map link
 */
export function isLocationURL(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const path = urlObj.pathname.toLowerCase()

    // Google Maps
    if (hostname.includes('google.com') && (
      path.includes('/maps') ||
      hostname.includes('maps.google')
    )) {
      return true
    }

    // Apple Maps
    if (hostname.includes('maps.apple.com')) {
      return true
    }

    // Waze
    if (hostname.includes('waze.com')) {
      return true
    }

    // OpenStreetMap
    if (hostname.includes('openstreetmap.org')) {
      return true
    }

    // What3Words
    if (hostname.includes('what3words.com') && !path.includes('/about') && !path.includes('/blog')) {
      return true
    }

    // Bing Maps
    if (hostname.includes('bing.com') && path.includes('/maps')) {
      return true
    }

    return false
  } catch (error) {
    return false
  }
}

/**
 * Extracts location data from a map URL
 */
export async function extractLocationFromURL(url: string): Promise<LocationData | null> {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const searchParams = urlObj.searchParams

    // Google Maps
    if (hostname.includes('google.com') && hostname.includes('maps') || hostname.includes('maps.google')) {
      return extractFromGoogleMaps(urlObj, searchParams)
    }

    // Apple Maps
    if (hostname.includes('maps.apple.com')) {
      return extractFromAppleMaps(searchParams)
    }

    // Waze
    if (hostname.includes('waze.com')) {
      return extractFromWaze(searchParams)
    }

    // OpenStreetMap
    if (hostname.includes('openstreetmap.org')) {
      return extractFromOSM(urlObj, searchParams)
    }

    // What3Words
    if (hostname.includes('what3words.com')) {
      return extractFromWhat3Words(urlObj)
    }

    // Bing Maps
    if (hostname.includes('bing.com')) {
      return extractFromBing(searchParams)
    }

    return null
  } catch (error) {
    console.error('Error extracting location from URL:', error)
    return null
  }
}

function extractFromGoogleMaps(urlObj: URL, searchParams: URLSearchParams): LocationData | null {
  // Format 1: /maps/place/Name/@lat,lng,zoom
  const pathMatch = urlObj.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (pathMatch) {
    const placeName = urlObj.pathname.match(/\/place\/([^/@]+)/)?.[1]
    return {
      latitude: parseFloat(pathMatch[1]),
      longitude: parseFloat(pathMatch[2]),
      locationName: placeName ? decodeURIComponent(placeName.replace(/\+/g, ' ')) : undefined,
      source: 'google_maps'
    }
  }

  // Format 2: ?q=lat,lng or ?q=location+name
  const query = searchParams.get('q')
  if (query) {
    const coordMatch = query.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
        source: 'google_maps'
      }
    }
    // If query is a location name, we'd need geocoding
    return {
      latitude: 0,
      longitude: 0,
      locationName: query.replace(/\+/g, ' '),
      source: 'google_maps'
    }
  }

  return null
}

function extractFromAppleMaps(searchParams: URLSearchParams): LocationData | null {
  // Format: ?ll=lat,lng or ?q=location
  const ll = searchParams.get('ll')
  if (ll) {
    const [lat, lng] = ll.split(',')
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      source: 'apple_maps'
    }
  }

  const query = searchParams.get('q')
  if (query) {
    return {
      latitude: 0,
      longitude: 0,
      locationName: query,
      source: 'apple_maps'
    }
  }

  return null
}

function extractFromWaze(searchParams: URLSearchParams): LocationData | null {
  // Format: ?ll=lat,lng
  const ll = searchParams.get('ll')
  if (ll) {
    const [lat, lng] = ll.split(',')
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      source: 'waze'
    }
  }

  return null
}

function extractFromOSM(urlObj: URL, searchParams: URLSearchParams): LocationData | null {
  // Format 1: ?mlat=lat&mlon=lng
  const mlat = searchParams.get('mlat')
  const mlon = searchParams.get('mlon')
  if (mlat && mlon) {
    return {
      latitude: parseFloat(mlat),
      longitude: parseFloat(mlon),
      source: 'osm'
    }
  }

  // Format 2: #map=zoom/lat/lng
  const hashMatch = urlObj.hash.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
  if (hashMatch) {
    return {
      latitude: parseFloat(hashMatch[1]),
      longitude: parseFloat(hashMatch[2]),
      source: 'osm'
    }
  }

  return null
}

function extractFromWhat3Words(urlObj: URL): LocationData | null {
  // Format: /word.word.word
  const pathMatch = urlObj.pathname.match(/\/([^/]+\.[^/]+\.[^/]+)/)
  if (pathMatch) {
    // What3Words requires API to convert to coordinates
    // For now, return with location name only
    return {
      latitude: 0,
      longitude: 0,
      locationName: pathMatch[1],
      source: 'what3words'
    }
  }

  return null
}

function extractFromBing(searchParams: URLSearchParams): LocationData | null {
  // Format: ?cp=lat~lng or ?q=location
  const cp = searchParams.get('cp')
  if (cp) {
    const [lat, lng] = cp.split('~')
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      source: 'bing'
    }
  }

  const query = searchParams.get('q')
  if (query) {
    return {
      latitude: 0,
      longitude: 0,
      locationName: query,
      source: 'bing'
    }
  }

  return null
}

/**
 * Generates a Google Maps URL from coordinates
 */
export function generateGoogleMapsURL(latitude: number, longitude: number, locationName?: string): string {
  if (locationName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

/**
 * Generates a static map image URL (using multiple fallbacks for reliability)
 */
export function generateStaticMapURL(latitude: number, longitude: number, zoom: number = 15, width: number = 600, height: number = 300): string {
  // Don't generate map for invalid coordinates
  if (latitude === 0 && longitude === 0) {
    return ''
  }

  // Use MapQuest Open Static Map API (more reliable than OSM staticmap)
  // Free tier, no API key required for basic usage
  return `https://www.mapquestapi.com/staticmap/v5/map?center=${latitude},${longitude}&zoom=${zoom}&size=${width},${height}&locations=${latitude},${longitude}|marker-sm-red`
}
