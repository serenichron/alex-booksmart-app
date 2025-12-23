import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { FeedbackDialog } from './FeedbackDialog'

export function FeedbackButton() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#0D7D81] to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        aria-label="Send Feedback"
      >
        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Feedback</span>
      </button>

      {/* Feedback Dialog */}
      <FeedbackDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
