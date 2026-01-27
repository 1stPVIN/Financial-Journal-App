"use client";

import { useState } from "react";
import { Category, TransactionType } from "@/lib/types";
import { iconMap, categoryColors } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Check, Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface CategoryManagerProps {
    categories: Category[];
    onAdd: (category: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
}

export function CategoryManager({ categories, onAdd, onEdit, onDelete }: CategoryManagerProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newName, setNewName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("Home");
    const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
    const [selectedType, setSelectedType] = useState<TransactionType>("expense");

    const resetForm = () => {
        setNewName("");
        setSelectedIcon("Home");
        setSelectedColor(categoryColors[0]);
        setSelectedType("expense");
        setEditingId(null);
        setIsFormOpen(false);
    };

    const startEdit = (cat: Category) => {
        setNewName(cat.name);
        setSelectedIcon(cat.icon);
        setSelectedColor(cat.color);
        setSelectedType(cat.type);
        setEditingId(cat.id);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const categoryData = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: newName,
            icon: selectedIcon,
            color: selectedColor,
            type: selectedType,
        };

        if (editingId) {
            onEdit(categoryData);
        } else {
            onAdd(categoryData);
        }

        resetForm();
    };

    const { t } = useLanguage();

    return (
        <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pr-10">
                <CardTitle className="text-lg font-serif">{t('categories')}</CardTitle>
                <Button
                    onClick={() => {
                        if (isFormOpen) {
                            setIsFormOpen(false);
                            resetForm();
                        } else {
                            resetForm();
                            setIsFormOpen(true);
                        }
                    }}
                    variant={isFormOpen ? "secondary" : "outline"} size="sm" className="gap-2"
                >
                    {isFormOpen ? <X size={14} /> : <Plus size={14} />}
                    {isFormOpen ? t('cancel') : t('addNew')}
                </Button>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    "grid transition-all duration-300 ease-in-out overflow-hidden",
                    isFormOpen ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0"
                )}>
                    <div className="min-h-0 bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold text-muted-foreground">
                                    {editingId ? t('editCategory') : t('newCategory')}
                                </h4>
                            </div>

                            <div className="flex gap-2 mb-2">
                                {["income", "expense", "savings"].map((tKey) => (
                                    <button
                                        key={tKey}
                                        type="button"
                                        onClick={() => setSelectedType(tKey as TransactionType)}
                                        className={cn(
                                            "flex-1 py-1 text-xs uppercase tracking-wider font-medium rounded transition-colors",
                                            selectedType === tKey ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted"
                                        )}
                                    >
                                        {t(tKey as any)}
                                    </button>
                                ))}
                            </div>

                            <Input
                                placeholder={t('categoryName')}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                            />

                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('icon')}</p>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                                    {Object.keys(iconMap).map((iconName) => {
                                        const Icon = iconMap[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setSelectedIcon(iconName)}
                                                className={cn(
                                                    "p-2 rounded-md transition-all hover:scale-105",
                                                    selectedIcon === iconName ? "bg-[#e6e2dd] ring-1 ring-[#d4a373]" : "hover:bg-[#e6e2dd]/50"
                                                )}
                                            >
                                                <Icon size={18} className="stroke-[1.5]" color={selectedColor} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('colorInk')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {categoryColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={cn(
                                                "w-6 h-6 rounded-full transition-transform hover:scale-110",
                                                selectedColor === color ? "ring-2 ring-offset-2 ring-ring" : ""
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>{t('cancel')}</Button>
                                <Button type="submit" size="sm">{editingId ? t('save') : t('save')}</Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Categories List Grouped */}
                <div className="space-y-6">
                    {(["income", "expense", "savings"] as const).map((groupType) => {
                        const groupTitle = groupType === 'income' ? t('income') : (groupType === 'savings' ? t('savings') : t('expense'));
                        const groupColor = groupType === "income" ? "text-emerald-700" : (groupType === "savings" ? "text-amber-600" : "text-rose-700");
                        const groupCats = categories.filter(c => c.type === groupType);

                        if (groupCats.length === 0) return null;

                        return (
                            <div key={groupType}>
                                <h3 className={cn("text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2", groupColor)}>
                                    <div className="h-[1px] bg-current w-4 opacity-50"></div>
                                    {groupTitle}
                                    <div className="h-[1px] bg-current flex-1 opacity-20"></div>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {groupCats.map((cat) => {
                                        const Icon = iconMap[cat.icon] || iconMap["Home"];
                                        return (
                                            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card group hover:shadow-sm transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-md bg-muted/50 text-foreground">
                                                        <Icon size={18} style={{ color: cat.color }} />
                                                    </div>
                                                    <div className="font-medium">{cat.name}</div>
                                                </div>
                                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => startEdit(cat)}
                                                        className="p-2 text-muted-foreground hover:text-primary transition-all"
                                                        title={t('editCategory')}
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(cat.id)}
                                                        className="p-2 text-muted-foreground hover:text-destructive transition-all"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {categories.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground italic">
                            {t('noCategoriesFound')} {t('addYourFirstOne')}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
