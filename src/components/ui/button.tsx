import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-600 text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5",
        destructive: "bg-red-500 text-white shadow-soft hover:bg-red-600 hover:shadow-soft-lg",
        outline: "border border-amber-200 bg-white/90 text-gray-700 shadow-sm hover:bg-amber-50/70 hover:border-amber-300",
        secondary: "bg-amber-100/75 text-amber-900 hover:bg-amber-200/70",
        ghost: "text-gray-600 hover:bg-amber-100/70 hover:text-gray-900",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "bg-gradient-to-r from-primary via-primary-500 to-primary-600 text-white shadow-premium-lg hover:brightness-105 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-sm",
        xl: "h-[52px] rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  glow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, leftIcon, rightIcon, glow, ...props }, ref) => {
    const resolvedVariant = glow && !variant ? "glow" : variant

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant: resolvedVariant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant: resolvedVariant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2 inline-flex items-center">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon ? <span className="ml-2 inline-flex items-center">{rightIcon}</span> : null}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
