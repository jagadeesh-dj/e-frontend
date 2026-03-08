import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-amber-200/80 bg-white/90 px-4 py-3 text-sm text-gray-800 shadow-sm transition-all duration-200",
          "placeholder:text-gray-400",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          "hover:border-amber-300",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50/80",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
