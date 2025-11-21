import * as React from "react"
import { MoreVertical, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      "transition-shadow duration-200",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

interface CardAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  primaryAction?: {
    icon: LucideIcon
    onClick: () => void
    label: string
  }
  secondaryActions?: CardAction[]
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, primaryAction, secondaryActions, children, ...props }, ref) => {
    const hasActions = primaryAction || (secondaryActions && secondaryActions.length > 0)
    const PrimaryIcon = primaryAction?.icon

    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">{children}</div>
          {hasActions && (
            <div className="flex items-center gap-1 -mt-1 -mr-1">
              {primaryAction && PrimaryIcon && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={primaryAction.onClick}
                      aria-label={primaryAction.label}
                    >
                      <PrimaryIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end">
                    {primaryAction.label}
                  </TooltipContent>
                </Tooltip>
              )}
              {secondaryActions && secondaryActions.length > 0 && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Plus d'actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="end">
                      Plus d'actions
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action, index) => {
                      const Icon = action.icon
                      return (
                        <DropdownMenuItem
                          key={index}
                          onClick={action.onClick}
                          className="cursor-pointer"
                        >
                          {Icon && <Icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-h3",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[0.6875rem] leading-tight text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
