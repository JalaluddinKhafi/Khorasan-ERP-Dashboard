/* Original template fixtures, shared by the browser-only modules. */
window.DemoData = Object.freeze({
products: [
                { 
                    id: 1, code: "P1001", name: "لپ تاپ ایسوس ROG Zephyrus", 
                    category: "الکترونیک", purchasePrice: 28500000, salePrice: 35500000, 
                    unit: "عدد", stock: 45, minStock: 10, status: "موجود", 
                    description: "پردازنده Intel Core i9-13900H، رم 32GB، حافظه 1TB SSD، نمایشگر 240Hz",
                    image: "", barcode: "1234567890123"
                },
                { 
                    id: 2, code: "P1002", name: "گوشی سامسونگ Galaxy S24 Ultra", 
                    category: "الکترونیک", purchasePrice: 38000000, salePrice: 42000000, 
                    unit: "عدد", stock: 8, minStock: 15, status: "در راه", 
                    description: "دوربین 200 مگاپیکسل، 12GB رم، 512GB حافظه",
                    image: "", barcode: "1234567890456"
                },
                { 
                    id: 3, code: "P1003", name: "هدفون سونی WH-1000XM5", 
                    category: "الکترونیک", purchasePrice: 6500000, salePrice: 8900000, 
                    unit: "عدد", stock: 112, minStock: 20, status: "موجود", 
                    description: "حذف نویز فعال، عمر باتری 30 ساعت",
                    image: "", barcode: "1234567890789"
                },
                { 
                    id: 4, code: "P1004", name: "تبلت اپل iPad Pro 12.9", 
                    category: "الکترونیک", purchasePrice: 42000000, salePrice: 48900000, 
                    unit: "عدد", stock: 3, minStock: 5, status: "ناموجود", 
                    description: "تراشه M2، 256GB، نمایشگر Liquid Retina XDR",
                    image: "", barcode: "1234567891011"
                },
                { 
                    id: 5, code: "P1005", name: "موس بی سیم لاجیتک MX Master 3", 
                    category: "الکترونیک", purchasePrice: 1850000, salePrice: 2500000, 
                    unit: "عدد", stock: 250, minStock: 30, status: "موجود", 
                    description: "طراحی ارگونومیک، شارژ با USB-C",
                    image: "", barcode: "1234567891213"
                }
            ],
customers: [
                { id: 1, code: "C-1001", name: "آرمان پوراحمد", type: "حقیقی", phone: "۰۹۱۲۱۲۳۴۵۶۷", email: "arman@gmail.com", address: "تهران، خیابان انقلاب", nationalId: "۱۲۳۴۵۶۷۸۹۰", creditLimit: 50000000, debt: 12500000, totalPurchases: 3 },
                { id: 2, code: "C-1002", name: "شرکت تدبیر", type: "حقوقی", phone: "۰۲۱-۸۸۷۷۶۶۵۵", email: "info@tadbir.com", address: "تهران، خیابان ولیعصر", nationalId: "۱۰۱۰۱۲۳۴۵۶۷", creditLimit: 200000000, debt: 33600000, totalPurchases: 8 },
                { id: 3, code: "C-1003", name: "مهدی رضایی", type: "حقیقی", phone: "۰۹۳۵۵۴۴۳۳۲۲", email: "mahdi@yahoo.com", address: "اصفهان، خیابان سپاه", nationalId: "۲۳۴۵۶۷۸۹۰۱", creditLimit: 20000000, debt: 0, totalPurchases: 1 },
                { id: 4, code: "C-1004", name: "فروشگاه دیجیتال", type: "حقوقی", phone: "۰۲۱-۵۵۴۴۳۳۲۱", email: "shop@digital.com", address: "مشهد، خیابان احمدآباد", nationalId: "۱۰۱۰۹۸۷۶۵۴۳", creditLimit: 150000000, debt: 45200000, totalPurchases: 12 }
            ],
suppliers: [
                { id: 1, code: "SUP-001", name: "توزیع کننده البرز", phone: "۰۲۱-۵۵۵۵۱۲۳۴", email: "info@alborz.com", address: "تهران، خیابان آزادی", account: "IR1234567890", status: "فعال", debt: 56000000 },
                { id: 2, code: "SUP-002", name: "واردات سامسونگ", phone: "۰۲۱-۵۵۵۵۶۷۸۹", email: "sales@samsung.ir", address: "تهران، خیابان ولیعصر", account: "IR0987654321", status: "فعال", debt: 234000000 },
                { id: 3, code: "SUP-003", name: "بازرگانی نوین", phone: "۰۲۱-۵۵۵۵۹۰۱۲", email: "info@novin.com", address: "کرج، میدان آزادگان", account: "", status: "غیرفعال", debt: 0 }
            ],
categories: [
                { id: 1, name: "الکترونیک", parentId: null, parentName: "ریشه", productCount: 48, status: "active", description: "محصولات الکترونیکی" },
                { id: 2, name: "لپ تاپ", parentId: 1, parentName: "الکترونیک", productCount: 15, status: "active", description: "" },
                { id: 3, name: "گوشی موبایل", parentId: 1, parentName: "الکترونیک", productCount: 12, status: "active", description: "" },
                { id: 4, name: "هدفون", parentId: 1, parentName: "الکترونیک", productCount: 8, status: "active", description: "" },
                { id: 5, name: "پوشاک", parentId: null, parentName: "ریشه", productCount: 32, status: "active", description: "" },
                { id: 6, name: "زنانه", parentId: 5, parentName: "پوشاک", productCount: 18, status: "active", description: "" },
                { id: 7, name: "مردانه", parentId: 5, parentName: "پوشاک", productCount: 14, status: "inactive", description: "" }
            ],
users: [
                { id: 1, username: "admin", fullname: "مدیر سیستم", email: "admin@company.com", phone: "۰۹۱۲۱۲۳۴۵۶۷", role: "مدیر سیستم", status: "فعال", lastLogin: "۱۴۰۲/۱۲/۰۵ ۱۴:۳۰" },
                { id: 2, username: "reza_ahmadi", fullname: "رضا احمدی", email: "reza@company.com", phone: "۰۹۱۲۲۳۳۴۴۵۵", role: "کارمند", status: "فعال", lastLogin: "۱۴۰۲/۱۲/۰۴ ۱۰:۱۵" },
                { id: 3, username: "sara_karimi", fullname: "سارا کریمی", email: "sara@company.com", phone: "۰۹۳۵۵۴۴۳۳۲۲", role: "ناظر", status: "فعال", lastLogin: "۱۴۰۲/۱۲/۰۵ ۰۹:۰۰" },
                { id: 4, username: "mohammad_h", fullname: "محمد حسینی", email: "mohammad@company.com", phone: "۰۹۰۱۲۳۴۵۶۷۸", role: "کارمند", status: "غیرفعال", lastLogin: "۱۴۰۲/۱۱/۲۸ ۱۶:۲۰" }
            ],
expenses: [
                { id: 1, date: "۱۴۰۲/۱۲/۰۵", category: "کرایه", desc: "اجاره ماهانه دفتر", amount: 25000000, method: "واریز بانکی", docNo: "CHK-001" },
                { id: 2, date: "۱۴۰۲/۱۲/۰۵", category: "معاش", desc: "حقوق آذر ماه", amount: 185000000, method: "واریز بانکی", docNo: "SAL-001" },
                { id: 3, date: "۱۴۰۲/۱۲/۰۴", category: "برق", desc: "قبض برق آبان", amount: 3850000, method: "نقدی", docNo: "" },
                { id: 4, date: "۱۴۰۲/۱۲/۰۳", category: "حمل و نقل", desc: "هزینه حمل کالا", amount: 5600000, method: "کارت به کارت", docNo: "TRX-001" },
                { id: 5, date: "۱۴۰۲/۱۲/۰۲", category: "سایر", desc: "خرید لوازم التحریر", amount: 850000, method: "نقدی", docNo: "" }
            ],
purchases: [
            { id: 1, invoiceNo: "P-001", supplier: "توزیع کننده البرز", date: "1405/03/12", total: 56000000, paid: 56000000, remaining: 0, status: "پرداخت شده", items: [{ product: "لپ تاپ", qty: 2, unit: "عدد", price: 25000000, discount: 0, total: 50000000 }] },
            { id: 2, invoiceNo: "P-002", supplier: "واردات سامسونگ", date: "1405/03/10", total: 234000000, paid: 100000000, remaining: 134000000, status: "پرداخت جزئی", items: [{ product: "گوشی", qty: 10, unit: "عدد", price: 18000000, discount: 0, total: 180000000 }] }
        ],
receipts: [
            {
                id: 1,
                receiptNumber: "1319",
                receiptDate: "1405/03/12",
                receiptTime: "07:10 PM",
                customerCode: "42",
                customerName: "آقای آریا",
                payerName: "نمایندگی قلعه نو حاجی قاسم",
                payerAddress: "قلعه نو",
                currency: "USD",
                exchangeRate: 166.5,
                exchangeAmount: 166.5,
                previousBalance: 0,
                demandAmount: 16666.462,
                discountAmount: 0,
                totalAmount: 166.5,
                amountInWords: "صد و شصت و هفت دلار",
                description: "بابت تخفیف فاکتور 450",
                status: "paid"
            },
            {
                id: 2,
                receiptNumber: "1320",
                receiptDate: "1405/03/10",
                receiptTime: "10:15 AM",
                customerCode: "42",
                customerName: "آقای آریا",
                payerName: "نمایندگی قلعه نو حاجی قاسم",
                payerAddress: "قلعه نو",
                currency: "USD",
                exchangeRate: 165.2,
                exchangeAmount: 500,
                previousBalance: 16666.462,
                demandAmount: 16166.462,
                discountAmount: 0,
                totalAmount: 500,
                amountInWords: "پانصد دلار",
                description: "پرداخت وجه فاکتورهای قبلی",
                status: "paid"
            }
        ],
sales: [
                { id: 1, invoiceNo: "S-001", customer: "آرمان پوراحمد", date: "۱۴۰۲/۱۲/۰۵", total: 12500000, status: "پرداخت شده" },
                { id: 2, invoiceNo: "S-002", customer: "شرکت تدبیر", date: "۱۴۰۲/۱۲/۰۴", total: 33600000, status: "در انتظار پرداخت" }
            ]
});

window.PublicBlogSeeds = Object.freeze([
            { id: 1, title: "۱۰ راهکار برای افزایش فروش در سال ۱۴۰۳", category: "management", date: "۱۴۰۲/۱۲/۱۰", author: "احمد رضایی", image: "../assets/images/placeholders/a5c5a02c0e8e.svg", excerpt: "در این مقاله به بررسی راهکارهای عملی برای افزایش فروش در سال جدید می‌پردازیم...", tags: ["مدیریت فروش", "بازاریابی"] },
            { id: 2, title: "بهترین نرم‌افزارهای انبارداری در ایران", category: "technology", date: "۱۴۰۲/۱۲/۰۸", author: "سارا کریمی", image: "../assets/images/placeholders/2bc45b9ff75a.svg", excerpt: "معرفی و مقایسه بهترین سیستم‌های مدیریت انبار متناسب با کسب و کار ایرانی...", tags: ["انبارداری", "نرم افزار"] },
            { id: 3, title: "اصول حسابداری برای کسب و کارهای کوچک", category: "finance", date: "۱۴۰۲/۱۲/۰۵", author: "محمد حسینی", image: "../assets/images/placeholders/bbd887222e6a.svg", excerpt: "آشنایی با اصول پایه حسابداری که هر صاحب کسب و کاری باید بداند...", tags: ["حسابداری", "مالی"] },
            { id: 4, title: "نقش هوش مصنوعی در مدیریت مدرن", category: "technology", date: "۱۴۰۲/۱۲/۰۳", author: "دکتر کریمی", image: "../assets/images/placeholders/74a10bffc354.svg", excerpt: "چگونه هوش مصنوعی می‌تواند فرآیندهای مدیریتی را متحول کند؟", tags: ["هوش مصنوعی", "فناوری"] },
            { id: 5, title: "مدیریت استراتژیک زنجیره تامین", category: "management", date: "۱۴۰۲/۱۲/۰۱", author: "احمد رضایی", image: "../assets/images/placeholders/55834df4d948.svg", excerpt: "بهبود کارایی زنجیره تامین با رویکردهای نوین مدیریتی...", tags: ["زنجیره تامین", "مدیریت"] },
            { id: 6, title: "گزارشگیری حرفه‌ای با Power BI", category: "technology", date: "۱۴۰۲/۱۱/۲۸", author: "سارا کریمی", image: "../assets/images/placeholders/8cb7892c9412.svg", excerpt: "آموزش ساخت داشبوردهای مدیریتی با Power BI", tags: ["داشبورد", "گزارش"] }
        ]);
