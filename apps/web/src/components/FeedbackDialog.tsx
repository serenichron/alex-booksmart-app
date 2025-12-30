import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MessageSquare, Camera, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import html2canvas from 'html2canvas'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FeedbackType = 'bug' | 'feature' | 'feedback'

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth()
  const [type, setType] = useState<FeedbackType>('feedback')
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const captureScreenshot = async () => {
    setIsCapturing(true)
    try {
      // Close dialog temporarily to capture the page
      onOpenChange(false)

      // Wait a bit for dialog to close
      await new Promise(resolve => setTimeout(resolve, 300))

      // Capture the page
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
      })

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'screenshot.png', { type: 'image/png' })
          setScreenshot(file)
          setScreenshotPreview(URL.createObjectURL(blob))
        }
        // Reopen dialog
        onOpenChange(true)
        setIsCapturing(false)
      }, 'image/png')
    } catch (err) {
      console.error('Screenshot capture failed:', err)
      setError('Failed to capture screenshot')
      onOpenChange(true)
      setIsCapturing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      setError('Please enter your feedback message')
      return
    }

    if (!user) {
      setError('You must be logged in to submit feedback')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      let screenshotUrl: string | null = null

      // Upload screenshot if provided
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(fileName, screenshot)

        if (uploadError) {
          console.error('Screenshot upload failed:', uploadError)
          // Continue without screenshot rather than failing completely
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('feedback-screenshots')
            .getPublicUrl(uploadData.path)

          screenshotUrl = urlData.publicUrl
        }
      }

      // Gather browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      }

      // Submit feedback
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          type,
          message: message.trim(),
          screenshot_url: screenshotUrl,
          page_url: window.location.href,
          browser_info: browserInfo,
        })

      if (insertError) {
        throw insertError
      }

      // Send email notification
      await fetch('/api/send-feedback-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          userEmail: user.email,
          pageUrl: window.location.href,
          screenshotUrl,
        }),
      }).catch(err => {
        console.error('Email notification failed:', err)
        // Don't fail the whole operation if email fails
      })

      // Success!
      setIsSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        // Reset form after closing
        setTimeout(() => {
          setType('feedback')
          setMessage('')
          setScreenshot(null)
          setScreenshotPreview(null)
          setIsSuccess(false)
        }, 300)
      }, 1500)

    } catch (err) {
      console.error('Feedback submission failed:', err)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Thank you!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Your feedback has been submitted successfully.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0D7D81] dark:text-cyan-400" />
              Send Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve BookSmart by sharing your thoughts, reporting bugs, or requesting features.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === 'bug'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Bug Report
                </button>
                <button
                  type="button"
                  onClick={() => setType('feature')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === 'feature'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Feature Request
                </button>
                <button
                  type="button"
                  onClick={() => setType('feedback')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === 'feedback'
                      ? 'bg-[#0D7D81] dark:bg-cyan-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  General
                </button>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Describe the bug you encountered...'
                    : type === 'feature'
                    ? 'Describe the feature you would like...'
                    : 'Share your thoughts...'
                }
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0D7D81] dark:focus:ring-cyan-400 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
                required
              />
            </div>

            {/* Screenshot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Screenshot (optional)
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureScreenshot}
                  disabled={isCapturing}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isCapturing ? 'Capturing...' : 'Capture Page'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {screenshotPreview && (
                <div className="mt-2 relative">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(null)
                      setScreenshotPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#0D7D81] to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
