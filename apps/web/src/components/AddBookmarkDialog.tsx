import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { analyzeBookmarkWithAI } from '@/lib/ai'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, X } from 'lucide-react'

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddBookmarkDialogProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Input step
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')

  // Review step (AI suggestions)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [type, setType] = useState<'link' | 'image' | 'text' | 'document' | 'video' | 'other'>('link')

  const reset = () => {
    setStep('input')
    setUrl('')
    setContent('')
    setTitle('')
    setSummary('')
    setCategories([])
    setTags([])
    setType('link')
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleAnalyze = async () => {
    if (!url && !content) {
      setError('Please enter a URL or some content')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get AI suggestions
      const suggestion = await analyzeBookmarkWithAI(url, content)

      setTitle(suggestion.title)
      setSummary(suggestion.summary)
      setCategories(suggestion.categories)
      setTags(suggestion.tags)
      setType(suggestion.type)
      setStep('review')
    } catch (err) {
      setError('Failed to analyze bookmark. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // 1. Save the bookmark
      const { data: bookmark, error: bookmarkError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          type,
          title,
          content,
          url: url || null,
          summary,
          mode: 'personal',
        })
        .select()
        .single()

      if (bookmarkError) throw bookmarkError

      // 2. Create categories if they don't exist and link them
      for (const categoryName of categories) {
        // Check if category exists
        let { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .eq('user_id', user.id)
          .single()

        let categoryId: string

        if (!existingCategory) {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: categoryName,
              mode: 'personal',
            })
            .select()
            .single()

          if (categoryError) throw categoryError
          categoryId = newCategory.id
        } else {
          categoryId = existingCategory.id
        }

        // Link bookmark to category
        await supabase.from('bookmark_categories').insert({
          bookmark_id: bookmark.id,
          category_id: categoryId,
          ai_suggested: true,
          confidence_score: 0.9,
        })
      }

      // 3. Create tags if they don't exist and link them
      for (const tagName of tags) {
        // Check if tag exists
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', user.id)
          .single()

        let tagId: string

        if (!existingTag) {
          // Create new tag
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              user_id: user.id,
              name: tagName,
            })
            .select()
            .single()

          if (tagError) throw tagError
          tagId = newTag.id
        } else {
          tagId = existingTag.id
        }

        // Link bookmark to tag
        await supabase.from('bookmark_tags').insert({
          bookmark_id: bookmark.id,
          tag_id: tagId,
        })
      }

      // Success!
      handleClose()
      onSuccess()
    } catch (err) {
      setError('Failed to save bookmark. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat))
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {step === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Bookmark</DialogTitle>
              <DialogDescription>
                Enter a URL or paste some content. AI will organize it for you! ✨
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6 pt-0">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  URL
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">or</div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Text/Content
                </label>
                <Textarea
                  id="content"
                  placeholder="Paste any text, notes, or content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={loading}
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle>Review & Save</DialogTitle>
              <DialogDescription>
                AI organized your bookmark. Edit if needed!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6 pt-0">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="summary" className="text-sm font-medium">
                  Summary
                </label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="gap-1">
                      {cat}
                      <button
                        onClick={() => removeCategory(cat)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {categories.length === 0 && (
                    <span className="text-sm text-muted-foreground">No categories</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="text-sm text-muted-foreground capitalize">{type}</div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('input')} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Bookmark'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
