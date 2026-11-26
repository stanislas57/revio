import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Revio "chunky" buttons (Duolingo-like): rounded, bold, a solid darker edge at the bottom (box-shadow, so the
// layout never moves) that disappears when the button is pressed.
const press =
  "active:translate-y-1 active:shadow-none disabled:active:translate-y-0 motion-reduce:active:translate-y-0"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-100 motion-reduce:transition-none outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground shadow-[0_4px_0_var(--edge-primary)] hover:bg-revio-primary-hover ${press}`,
        destructive: `bg-destructive-solid text-white shadow-[0_4px_0_var(--edge-danger)] hover:bg-destructive-solid/90 focus-visible:ring-destructive-solid/30 ${press}`,
        outline: `border-2 bg-card shadow-[0_4px_0_var(--edge-neutral)] hover:bg-accent hover:text-accent-foreground ${press}`,
        secondary: `bg-secondary text-secondary-foreground shadow-[0_4px_0_var(--edge-soft)] hover:bg-secondary/80 ${press}`,
        /** Rewards and XP only (Electric Lime, midnight text). */
        reward: `bg-revio-lime text-revio-midnight shadow-[0_4px_0_var(--edge-lime)] hover:bg-revio-lime/85 ${press}`,
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        /** The big buttons of the onboarding, the agenda steps and the Focus screen. */
        xl: "h-14 rounded-2xl px-8 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
