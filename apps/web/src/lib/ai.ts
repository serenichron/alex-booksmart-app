import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Note: For demo only. In production, use a backend API
})

export interface BookmarkSuggestion {
  title: string
  summary: string
  categories: string[]
  tags: string[]
  type: 'link' | 'image' | 'text' | 'document' | 'video' | 'other'
}

export async function analyzeBookmarkWithAI(
  url?: string,
  content?: string,
  existingCategories: string[] = []
): Promise<BookmarkSuggestion> {
  const prompt = `You are an AI assistant helping organize bookmarks.
${url ? `URL: ${url}` : ''}
${content ? `Content: ${content}` : ''}

${existingCategories.length > 0 ? `User's existing categories: ${existingCategories.join(', ')}` : ''}

Analyze this bookmark and suggest:
1. A clear, concise title (if URL provided, infer from domain/path)
2. A brief 1-2 sentence summary
3. 2-3 relevant categories (use existing ones when possible, or suggest new ones)
4. 3-5 relevant tags
5. The content type (link, image, text, document, video, or other)

Respond ONLY with valid JSON in this exact format:
{
  "title": "Title here",
  "summary": "Summary here",
  "categories": ["Category1", "Category2"],
  "tags": ["tag1", "tag2", "tag3"],
  "type": "link"
}`

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from response (Claude might wrap it in markdown)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response')
  }

  const suggestion: BookmarkSuggestion = JSON.parse(jsonMatch[0])
  return suggestion
}

export async function generateEmbedding(_text: string): Promise<number[]> {
  // For now, return a dummy embedding
  // In production, you'd call Voyage AI or OpenAI embeddings API
  // This is a placeholder - we'll implement real embeddings later
  return Array(1536).fill(0).map(() => Math.random())
}
