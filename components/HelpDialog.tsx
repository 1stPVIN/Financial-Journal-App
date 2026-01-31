
"use client";

import { X, Search, ChevronDown, ChevronRight, BookOpen, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { helpTopics } from "@/lib/help-content";

interface HelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
    const { t, language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    const filteredTopics = useMemo(() => {
        if (!searchQuery.trim()) return helpTopics;

        const query = searchQuery.toLowerCase();
        return helpTopics.filter(topic => {
            const title = topic.title[language].toLowerCase();
            const desc = topic.description[language].toLowerCase();
            const contentMatch = topic.sections.some(s =>
                s.title[language].toLowerCase().includes(query)
            );
            const keywordMatch = topic.keywords.some(k => k.toLowerCase().includes(query));

            return title.includes(query) || desc.includes(query) || contentMatch || keywordMatch;
        });
    }, [searchQuery, language]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-background w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-border bg-card flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-serif text-foreground">{t('helpCenter')}</h2>
                                    <p className="text-xs text-muted-foreground">{t('howToUse')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative z-10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 bg-muted/30 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('searchHelp')}
                                    className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                            {filteredTopics.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTopics.map((topic) => (
                                        <div
                                            key={topic.id}
                                            className={cn(
                                                "border rounded-xl transition-all duration-300 overflow-hidden",
                                                expandedTopic === topic.id
                                                    ? "bg-card border-primary/30 shadow-md"
                                                    : "bg-card/50 border-border hover:border-primary/20 hover:bg-card"
                                            )}
                                        >
                                            <button
                                                onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                                                className="w-full flex items-center gap-4 p-4 text-left rtl:text-right"
                                            >
                                                <div className={cn(
                                                    "p-3 rounded-full transition-colors",
                                                    expandedTopic === topic.id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground group-hover:text-primary"
                                                )}>
                                                    <topic.icon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={cn("font-bold text-base transition-colors", expandedTopic === topic.id ? "text-primary" : "text-foreground")}>
                                                        {topic.title[language]}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {topic.description[language]}
                                                    </p>
                                                </div>
                                                <div className={cn("text-muted-foreground transition-transform duration-300", expandedTopic === topic.id && "rotate-180")}>
                                                    <ChevronDown size={20} />
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {expandedTopic === topic.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <div className="px-6 pb-6 pt-2 space-y-6 border-t border-border/50">
                                                            {topic.sections.map((section, idx) => (
                                                                <div key={idx} className="relative pl-4 rtl:pr-4 rtl:pl-0 border-l-2 rtl:border-l-0 rtl:border-r-2 border-primary/20">
                                                                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                                                                        {section.title[language]}
                                                                    </h4>
                                                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                                                        {section.content[language]}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Search size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-1">{t('noResults')} "{searchQuery}"</h3>
                                    <p className="text-sm">{t('tryDifferent')}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-muted/20 border-t border-border text-center">
                            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                                <BookOpen size={12} />
                                Financial Journal Guide &copy; 2026
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
