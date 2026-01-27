import React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface BookLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function BookLayout({ children, className, ...props }: BookLayoutProps) {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen p-2 sm:p-8 flex justify-center bg-muted">
            <div
                className={cn(
                    "w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-background shadow-2xl relative",
                    "border border-border rounded-[2px]",
                    "flex flex-col",
                    className
                )}
                style={{
                    boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
                }}
                {...props}
            >
                {/* Binding Effect Removed as per user request */}

                {/* Content Area */}
                <div className="flex-1 p-3 md:p-12 ml-3 md:ml-8 relative z-0">
                    {children}
                </div>

                {/* Page Number (Decorative) */}
                <div className="absolute bottom-4 right-6 text-xs text-muted-foreground font-serif tracking-widest opacity-60">
                    {t('page')} {new Date().getDate()}
                </div>
            </div>
        </div>
    );
}
