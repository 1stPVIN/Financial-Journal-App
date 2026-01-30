"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface DatePickerProps {
    value: string; // ISO format YYYY-MM-DD
    onChange: (date: string) => void;
    className?: string;
}

const MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MONTHS_AR = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const DAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_AR = ["أح", "إث", "ث", "أر", "خ", "ج", "س"];

export function DatePicker({ value, onChange, className }: DatePickerProps) {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse the current value or default to today
    const selectedDate = value ? new Date(value) : new Date();
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

    const months = language === 'ar' ? MONTHS_AR : MONTHS_EN;
    const days = language === 'ar' ? DAYS_AR : DAYS_EN;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync view month/year when value changes externally
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                setViewMonth(d.getMonth());
                setViewYear(d.getFullYear());
            }
        }
    }, [value]);

    // Generate calendar grid
    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleSelectDate = (day: number) => {
        const newDate = new Date(viewYear, viewMonth, day);
        const isoDate = newDate.toISOString().split('T')[0];
        onChange(isoDate);
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        setViewMonth(today.getMonth());
        setViewYear(today.getFullYear());
        onChange(today.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    // Handle manual text input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);

    // Generate year options (current year ± 10 years)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        const sel = new Date(value);
        return day === sel.getDate() && viewMonth === sel.getMonth() && viewYear === sel.getFullYear();
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {/* Input with Calendar Button */}
            <div className="relative flex items-center">
                <input
                    type="date"
                    value={value}
                    onChange={handleInputChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-1 rtl:right-auto rtl:left-1 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                    title={language === 'ar' ? 'فتح التقويم' : 'Open calendar'}
                >
                    <CalendarIcon size={16} />
                </button>
            </div>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 w-[280px] animate-in fade-in slide-in-from-top-2">
                    {/* Header with Month/Year */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 rounded-full hover:bg-muted transition-colors"
                        >
                            <ChevronLeft size={16} className="rtl:rotate-180" />
                        </button>

                        <div className="flex items-center gap-1">
                            {/* Month selector */}
                            <select
                                value={viewMonth}
                                onChange={(e) => setViewMonth(parseInt(e.target.value))}
                                className="bg-popover font-medium text-sm cursor-pointer hover:text-primary focus:outline-none border-none"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>

                            {/* Year selector */}
                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(parseInt(e.target.value))}
                                className="bg-popover font-medium text-sm cursor-pointer hover:text-primary focus:outline-none border-none"
                            >
                                {yearOptions.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 rounded-full hover:bg-muted transition-colors"
                        >
                            <ChevronRight size={16} className="rtl:rotate-180" />
                        </button>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {days.map((d, i) => (
                            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before first day of month */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelectDate(day)}
                                    className={cn(
                                        "h-8 w-full rounded-md text-sm font-medium transition-colors",
                                        isSelected(day)
                                            ? "bg-primary text-primary-foreground"
                                            : isToday(day)
                                                ? "bg-accent text-accent-foreground ring-1 ring-primary"
                                                : "hover:bg-muted"
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today Button */}
                    <div className="mt-3 pt-3 border-t border-border">
                        <button
                            type="button"
                            onClick={handleToday}
                            className="w-full text-center text-sm text-primary hover:underline"
                        >
                            {language === 'ar' ? 'اليوم' : 'Today'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
