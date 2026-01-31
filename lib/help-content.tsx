
import {
  LayoutDashboard,
  PlusCircle,
  Tags,
  CalendarClock,
  RefreshCcw,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Globe,
  Cloud,
  Plus,
  Calendar,
  Paperclip,
  Trash2,
  Edit,
  Wallet,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  PieChart,
  Download,
  Share2,
  RotateCcw,
  Zap,
  Lock,
  Palette,
  LayoutGrid,
  AlertTriangle
} from "lucide-react";
import React from 'react';

export type HelpTopic = {
  id: string;
  icon: any;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  sections: {
    title: { en: string; ar: string };
    content: { en: React.ReactNode; ar: React.ReactNode };
  }[];
  keywords: string[];
};

// Helper for inline icons
const InlineIcon = ({ icon: Icon, color = "text-primary" }: { icon: any, color?: string }) => (
  <span className={`inline-flex items-center justify-center p-1 mx-1 rounded-md bg-muted ${color} align-middle`}>
    <Icon size={14} />
  </span>
);

// Helper for color circles
const ColorSample = ({ color, name }: { color: string, name: string }) => (
  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md border bg-card align-middle mx-1">
    <span className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: color }} />
    <span className="text-xs font-medium">{name}</span>
  </span>
);

// Helper fake icon for dollar since lucide might not have 'DollarSignIcon' exported directly as such in all versions
const DollarSignIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);


export const helpTopics: HelpTopic[] = [
  {
    id: "getting-started",
    icon: LayoutDashboard,
    title: { en: "Dashboard & Overview", ar: "لوحة المعلومات والنظرة العامة" },
    description: {
      en: "Understanding your financial health snapshot.",
      ar: "فهم لقطة وضعك المالي."
    },
    sections: [
      {
        title: { en: "Key Indicators", ar: "المؤشرات الرئيسية" },
        content: {
          en: (
            <div className="space-y-3">
              <p>Top cards provide instant metrics:</p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
                <li><strong className="text-emerald-600">Total Income:</strong> Sum of all money received.</li>
                <li><strong className="text-rose-600">Expenses:</strong> Sum of all spending.</li>
                <li><strong className="text-primary">Net Balance:</strong> (Income - Expenses - Savings). This is your actual spendable cash.</li>
                <li><strong className="text-amber-600">Savings:</strong> Money set aside for goals.</li>
              </ul>
            </div>
          ),
          ar: (
            <div className="space-y-3">
              <p>البطاقات العلوية توفر مقاييس فورية:</p>
              <ul className="list-disc pr-5 space-y-2 text-muted-foreground text-sm">
                <li><strong className="text-emerald-600">إجمالي الدخل:</strong> مجموع كل الأموال المستلمة.</li>
                <li><strong className="text-rose-600">المصروفات:</strong> مجموع كل ما تم إنفاقه.</li>
                <li><strong className="text-primary">صافي الرصيد:</strong> (الدخل - المصروفات - الادخار). هذا هو المبلغ النقدي المتاح للصرف.</li>
                <li><strong className="text-amber-600">الادخار:</strong> الأموال المخصصة للأهداف.</li>
              </ul>
            </div>
          )
        }
      },
      {
        title: { en: "Interactive Charts", ar: "الرسوم البيانية التفاعلية" },
        content: {
          en: (
            <div className="space-y-2">
              <p>The main chart has three powerful modes:</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <InlineIcon icon={BarChart3} /> <strong>Income vs Expense:</strong> Compare inflow and outflow directly.
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <InlineIcon icon={TrendingUp} /> <strong>Balance Trend:</strong> See how your total balance grows (or shrinks) over time.
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <InlineIcon icon={PieChart} /> <strong>Expense Breakdown:</strong> See exactly where your money goes by category (e.g., 50% Housing, 20% Food).
                </div>
              </div>
            </div>
          ),
          ar: (
            <div className="space-y-2">
              <p>الرسم البياني الرئيسي يحتوي على ثلاثة أوضاع قوية:</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <InlineIcon icon={BarChart3} /> <strong>الدخل مقابل المصروف:</strong> قارن التدفقات المالية مباشرة.
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <InlineIcon icon={TrendingUp} /> <strong>اتجاه الرصيد:</strong> شاهد كيف ينمو (أو يتقلص) رصيدك بمرور الوقت.
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <InlineIcon icon={PieChart} /> <strong>توزيع المصروفات:</strong> اعرف بالضبط أين تذهب أموالك حسب التصنيف (مثلاً 50% سكن، 20% طعام).
                </div>
              </div>
            </div>
          )
        }
      }
    ],
    keywords: ["dashboard", "chart", "graph", "trend", "pie", "balance", "income", "expense", "لوحة", "رسم", "بياني", "اتجاه", "رصيد"]
  },
  {
    id: "transactions",
    icon: PlusCircle,
    title: { en: "Creating Content", ar: "إنشاء المحتوى" },
    description: {
      en: "Detailed guide on adding entries and attachments.",
      ar: "دليل مفصل حول إضافة السجلات والمرفقات."
    },
    sections: [
      {
        title: { en: "Adding an Entry", ar: "إضافة سجل" },
        content: {
          en: (
            <div className="space-y-4">
              <p>Click <InlineIcon icon={Plus} /> to open the form. Key features include:</p>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="font-bold text-primary min-w-[20px]">1.</span>
                  <span><strong>Date Picker:</strong> Click <InlineIcon icon={Calendar} /> to backdate entries if you forgot to add them yesterday.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary min-w-[20px]">2.</span>
                  <span><strong>Different Currencies:</strong> You can record an expense in USD <InlineIcon icon={DollarSignIcon} /> even if your main currency is SAR. The app creates the record in the original currency.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary min-w-[20px]">3.</span>
                  <span><strong>Payment Links:</strong> Paste a URL in the "Payment Link" field to save digital receipts or invoice links.</span>
                </li>
              </ul>
            </div>
          ),
          ar: (
            <div className="space-y-4">
              <p>اضغط <InlineIcon icon={Plus} /> لفتح النموذج. المميزات الرئيسية:</p>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="font-bold text-primary min-w-[20px]">1.</span>
                  <span><strong>اختيار التاريخ:</strong> اضغط <InlineIcon icon={Calendar} /> لتسجيل عمليات بتاريخ قديم إذا نسيت إضافتها بالأمس.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary min-w-[20px]">2.</span>
                  <span><strong>عملات مختلفة:</strong> يمكنك تسجيل مصروف بالدولار <InlineIcon icon={DollarSignIcon} /> حتى لو كانت عملتك الأساسية الريال. التطبيق يحفظ السجل بالعملة الأصلية.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary min-w-[20px]">3.</span>
                  <span><strong>روابط الدفع:</strong> الصق رابطاً في حقل "رابط الدفع" لحفظ الإيصالات الرقمية أو روابط الفواتير.</span>
                </li>
              </ul>
            </div>
          )
        }
      },
      {
        title: { en: "Drag & Drop Attachments", ar: "سحب وإفلات المرفقات" },
        content: {
          en: (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
              <p className="font-semibold mb-2 flex items-center gap-2"><InlineIcon icon={Paperclip} /> Pro Tip:</p>
              <p className="text-sm">
                You don't need to click the upload button. You can simply <strong>Drag and Drop</strong> any image or PDF directly onto the form to attach it.
                You can also <strong>Copy</strong> an image from anywhere and press <strong>Ctrl+V</strong> to paste it directly!
              </p>
            </div>
          ),
          ar: (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
              <p className="font-semibold mb-2 flex items-center gap-2"><InlineIcon icon={Paperclip} /> نصيحة احترافية:</p>
              <p className="text-sm">
                لا تحتاج للضغط على زر الرفع. يمكنك ببساطة <strong>سحب وإفلات</strong> أي صورة أو ملف PDF مباشرة فوق النموذج لإرفاقه.
                يمكنك أيضاً <strong>نسخ</strong> صورة من أي مكان والضغط على <strong>Ctrl+V</strong> للصقها مباشرة!
              </p>
            </div>
          )
        }
      }
    ],
    keywords: ["add", "entry", "drag", "drop", "paste", "pdf", "image", "currency", "إضافة", "سحب", "نسخ", "لصق", "صورة", "عملة"]
  },
  {
    id: "recurring",
    icon: CalendarClock,
    title: { en: "Automation (Recurring)", ar: "الأتمتة (المتكرر)" },
    description: {
      en: "Managing monthly commitments efficiently.",
      ar: "إدارة الالتزامات الشهرية بكفاءة."
    },
    sections: [
      {
        title: { en: "Workflow", ar: "سير العمل" },
        content: {
          en: (
            <div className="space-y-3">
              <p>Instead of typing "Rent" every month:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Add it once in the <InlineIcon icon={CalendarClock} /> widget.</li>
                <li>Set the default due day (e.g., Day 1 of month).</li>
                <li>When you pay it, just select it from the list and click <strong>Process</strong>.</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-2">
                This effectively "clones" the recurring item into your actual transaction log with today's date, saving you time.
              </p>
            </div>
          ),
          ar: (
            <div className="space-y-3">
              <p>بدلاً من كتابة "إيجار" كل شهر:</p>
              <ol className="list-decimal pr-5 space-y-2">
                <li>أضفه مرة واحدة في أداة <InlineIcon icon={CalendarClock} />.</li>
                <li>حدد يوم الاستحقاق الافتراضي (مثلاً يوم 1 في الشهر).</li>
                <li>عندما تدفع، فقط حدده من القائمة واضغط <strong>معالجة</strong>.</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-2">
                هذا يقوم فعلياً "بنسخ" العنصر المتكرر إلى سجل معاملاتك الفعلي بتاريخ اليوم، مما يوفر عليك الوقت.
              </p>
            </div>
          )
        }
      }
    ],
    keywords: ["recurring", "automation", "automate", "bills", "cloning", "تكرار", "أتمتة", "فواتير", "نسخ"]
  },
  {
    id: "settings",
    icon: Settings,
    title: { en: "App Configuration", ar: "إعدادات التطبيق" },
    description: {
      en: "Customize Themes, View Modes, and Data.",
      ar: "تخصيص السمات، أوضاع العرض، والبيانات."
    },
    sections: [
      {
        title: { en: "Themes & Appearance", ar: "السمات والمظهر" },
        content: {
          en: (
            <div className="space-y-3">
              <p>Personalize your experience with curated color themes:</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <ColorSample color="#fdfbf7" name="Classic" />
                <ColorSample color="#0f172a" name="Midnight" />
                <ColorSample color="#022c22" name="Emerald" />
                <ColorSample color="#2e1065" name="Royal" />
              </div>
              <p className="text-sm text-muted-foreground">
                <InlineIcon icon={Palette} /> <strong>Dark Mode:</strong> Toggle dark mode independently of your theme to reduce eye strain at night.
              </p>
            </div>
          ),
          ar: (
            <div className="space-y-3">
              <p>خصص تجربتك مع سمات ألوان منتقاة بعناية:</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <ColorSample color="#fdfbf7" name="كلاسيكي" />
                <ColorSample color="#0f172a" name="توت الليل" />
                <ColorSample color="#022c22" name="زمردي" />
                <ColorSample color="#2e1065" name="ملكي" />
              </div>
              <p className="text-sm text-muted-foreground">
                <InlineIcon icon={Palette} /> <strong>الوضع الليلي:</strong> قم بتبديل الوضع الليلي بشكل مستقل عن السمة لتخفيف إجهاد العين ليلاً.
              </p>
            </div>
          )
        }
      },
      {
        title: { en: "Dashboard Widgets", ar: "أدوات لوحة التحكم" },
        content: {
          en: (
            <div className="space-y-2">
              <p>You can toggle dashboard widgets ON/OFF from settings:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="border p-2 rounded bg-card flex items-center gap-2">
                  <InlineIcon icon={CalendarClock} />
                  <span><strong>Monthly Commitments:</strong> Shows your recurring bills widget.</span>
                </div>
                <div className="border p-2 rounded bg-card flex items-center gap-2">
                  <InlineIcon icon={RefreshCcw} />
                  <span><strong>Currency Converter:</strong> Shows the live exchange rate tool.</span>
                </div>
              </div>
            </div>
          ),
          ar: (
            <div className="space-y-2">
              <p>يمكنك تشغيل/إيقاف أدوات اللوحة من الإعدادات:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="border p-2 rounded bg-card flex items-center gap-2">
                  <InlineIcon icon={CalendarClock} />
                  <span><strong>الالتزامات الشهرية:</strong> يعرض أداة الفواتير المتكررة.</span>
                </div>
                <div className="border p-2 rounded bg-card flex items-center gap-2">
                  <InlineIcon icon={RefreshCcw} />
                  <span><strong>محول العملات:</strong> يعرض أداة أسعار الصرف الحية.</span>
                </div>
              </div>
            </div>
          )
        }
      },
      {
        title: { en: "Security & Privacy", ar: "الأمان والخصوصية" },
        content: {
          en: (
            <div className="space-y-2">
              <p>
                <InlineIcon icon={Lock} /> <strong>App Lock:</strong> Set a password that is required every time the app opens.
                This helps keep your financial calculations private if others use your device.
              </p>
            </div>
          ),
          ar: (
            <div className="space-y-2">
              <p>
                <InlineIcon icon={Lock} /> <strong>قفل التطبيق:</strong> تعيين كلمة مرور مطلوبة في كل مرة يفتح فيها التطبيق.
                هذا يساعد في إبقاء حساباتك المالية خاصة إذا كان الآخرون يستخدمون جهازك.
              </p>
            </div>
          )
        }
      },
      {
        title: { en: "Data Safety (Backup & Restore)", ar: "سلامة البيانات (النسخ والاستعادة)" },
        content: {
          en: (
            <div className="space-y-3">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800 text-xs">
                <strong><InlineIcon icon={ShieldCheck} color="text-amber-600" /> Data Storage:</strong>
                Your data is synced securely to your account. However, you can also download local backups.
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="border p-2 rounded bg-card">
                  <strong className="block mb-1 text-primary flex items-center gap-2"><InlineIcon icon={Download} /> Manual Backup (File)</strong>
                  Downloads a <code>.json</code> file to your device. Save this file to keep your data safe.
                </div>
                <div className="border p-2 rounded bg-card">
                  <strong className="block mb-1 text-primary flex items-center gap-2"><InlineIcon icon={RotateCcw} /> Restore (File)</strong>
                  Uploads a previously saved file.
                  <span className="block text-muted-foreground mt-1 text-[10px] flex items-center gap-1">
                    <InlineIcon icon={AlertTriangle} color="text-amber-500" /> This wipes current data and replaces it with the file content.
                  </span>
                </div>
                <div className="border p-2 rounded bg-card border-rose-200 dark:border-rose-900/30">
                  <strong className="block mb-1 text-rose-600 flex items-center gap-2"><InlineIcon icon={Trash2} color="text-rose-600" /> Reset Data</strong>
                  <p>Deletes all data to start fresh.</p>
                  <p className="mt-1 text-emerald-600 dark:text-emerald-500 font-medium">
                    <InlineIcon icon={CheckCircle2} color="text-emerald-600" /> Safety Net:
                  </p>
                  <p className="text-muted-foreground">
                    When you click Reset, the app allows you to <strong>"Undo"</strong> immediately.
                    A temporary internal backup is created automatically before deletion, so you can restore if it was a mistake.
                  </p>
                </div>
              </div>
            </div>
          ),
          ar: (
            <div className="space-y-3">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800 text-xs">
                <strong><InlineIcon icon={ShieldCheck} color="text-amber-600" /> تخزين البيانات:</strong>
                تتم مزامنة بياناتك بشكل آمن مع حسابك. ومع ذلك، يمكنك أيضاً تحميل نسخ احتياطية محلية.
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="border p-2 rounded bg-card">
                  <strong className="block mb-1 text-primary flex items-center gap-2"><InlineIcon icon={Download} /> نسخ احتياطي يدوي (ملف)</strong>
                  يقوم بتحميل ملف <code>.json</code> لجهازك. احفظ هذا الملف لضمان سلامة بياناتك.
                </div>
                <div className="border p-2 rounded bg-card">
                  <strong className="block mb-1 text-primary flex items-center gap-2"><InlineIcon icon={RotateCcw} /> استعادة (ملف)</strong>
                  يرفع ملفاً محفوظاً مسبقاً.
                  <span className="block text-muted-foreground mt-1 text-[10px] flex items-center gap-1">
                    <InlineIcon icon={AlertTriangle} color="text-amber-500" /> هذا يمسح البيانات الحالية ويستبدلها بمحتوى الملف.
                  </span>
                </div>
                <div className="border p-2 rounded bg-card border-rose-200 dark:border-rose-900/30">
                  <strong className="block mb-1 text-rose-600 flex items-center gap-2"><InlineIcon icon={Trash2} color="text-rose-600" /> إعادة الضبط (مسح)</strong>
                  <p>يحذف جميع البيانات للبدء من جديد.</p>
                  <p className="mt-1 text-emerald-600 dark:text-emerald-500 font-medium">
                    <InlineIcon icon={CheckCircle2} color="text-emerald-600" /> شبكة الأمان:
                  </p>
                  <p className="text-muted-foreground">
                    عند الضغط على إعادة الضبط، يتيح لك التطبيق خيار <strong>"تراجع"</strong> فوراً.
                    يتم إنشاء نسخة احتياطية داخلية مؤقتة تلقائياً قبل الحذف، بحيث يمكنك الاستعادة في حال كان الأمر خطأ.
                  </p>
                </div>
              </div>
            </div>
          )
        }
      }
    ],
    keywords: ["backup", "restore", "json", "reset", "view", "monthly", "yearly", "نسخ", "استعادة", "ضبط", "شهري", "سنوي", "أمان", "قفل", "password", "widgets", "themes"]
  },
  {
    id: "export",
    icon: Share2,
    title: { en: "Reports & Export", ar: "التقارير والتصدير" },
    description: {
      en: "Getting your data out of the app.",
      ar: "إخراج بياناتك من التطبيق."
    },
    sections: [
      {
        title: { en: "Available Formats", ar: "الصيغ المتاحة" },
        content: {
          en: (
            <div className="space-y-3">
              <p>Click the <InlineIcon icon={Share2} /> button to reveal options:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <InlineIcon icon={FileSpreadsheet} color="text-emerald-600" />
                  <div>
                    <p className="font-bold text-sm">Excel Report</p>
                    <p className="text-xs text-muted-foreground">Best for analysis. Creates a spreadsheet with columns for Date, Amount, Category, Description, and Type.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <InlineIcon icon={Download} color="text-rose-600" />
                  <div>
                    <p className="font-bold text-sm">PDF Report</p>
                    <p className="text-xs text-muted-foreground">Best for sharing/printing. Generates a clean, professional document summarizing your financial status.</p>
                  </div>
                </div>
              </div>
            </div>
          ),
          ar: (
            <div className="space-y-3">
              <p>اضغط زر <InlineIcon icon={Share2} /> لإظهار الخيارات:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <InlineIcon icon={FileSpreadsheet} color="text-emerald-600" />
                  <div>
                    <p className="font-bold text-sm">تقرير Excel</p>
                    <p className="text-xs text-muted-foreground">الأفضل للتحليل. ينشئ جدول بيانات بأعمدة للتاريخ، المبلغ، التصنيف، الوصف، والنوع.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <InlineIcon icon={Download} color="text-rose-600" />
                  <div>
                    <p className="font-bold text-sm">تقرير PDF</p>
                    <p className="text-xs text-muted-foreground">الأفضل للمشاركة/الطباعة. يولد مستنداً نظيفاً واحترافياً يلخص وضعك المالي.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      }
    ],
    keywords: ["export", "excel", "pdf", "print", "report", "spreadsheet", "تصدير", "طباعة", "تقرير", "جدول"]
  }
];
