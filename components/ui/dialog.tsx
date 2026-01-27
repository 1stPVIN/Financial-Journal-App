import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

const DialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => { } })

const Dialog = ({
    open = false,
    onOpenChange = () => { },
    children,
}: {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => onOpenChange(false)}
                        />
                        {children}
                    </div>
                )}
            </AnimatePresence>
        </DialogContext.Provider>
    )
}

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "relative z-50 grid w-full max-w-lg gap-4 rounded-xl bg-[#fdfbf7] p-6 shadow-xl border border-[#e6e2dd]",
                className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props as any}
        >
            <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                onClick={() => onOpenChange(false)}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </button>
            {children}
        </motion.div>
    )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight font-serif text-primary",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
