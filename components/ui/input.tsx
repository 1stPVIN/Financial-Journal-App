import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full border-b-2 border-border bg-background/50 px-4 py-2 text-lg shadow-sm transition-all duration-300",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                        "placeholder:text-muted-foreground/70",
                        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "group-hover:border-primary/50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {/* Glow Effect on Focus */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 will-change-transform shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
