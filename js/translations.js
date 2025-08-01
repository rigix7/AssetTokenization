// Bilingual Translation System for Agricultural Asset Tokenization Platform
// Support for English and Bahasa Indonesia

const translations = {
    en: {
        // Navigation
        nav: {
            dashboard: "Dashboard",
            farmers: "🚜 Farmers",
            kitchens: "🍳 Kitchens", 
            authority: "👔 Authority"
        },
        
        // Connection Status
        connection: {
            not_connected: "Not connected to Web3. Please connect your wallet.",
            connect_wallet: "Connect Wallet",
            connected: "Connected to Web3",
            account: "Account"
        },
        
        // Platform Status
        status: {
            platform_operational: "Platform Status: Operational",
            platform_description: "Agricultural Asset Tokenization Platform is fully deployed and operational on Hardhat Network.",
            deployed_contracts: "Deployed Contracts",
            registered_suppliers: "Registered Suppliers",
            completed_transactions: "Completed Transactions",
            network: "Network"
        },
        
        // Dashboard
        dashboard: {
            platform_statistics: "Platform Statistics",
            total_minted: "Total Minted",
            budget_allocation: "Budget Allocation",
            escrow_trade: "Escrow Trade",
            completed: "Completed",
            days_expiry: "days expiry",
            days_budget: "days budget"
        },
        
        // Farmers Section
        farmers: {
            title: "Chicken Farmers Dashboard",
            subtitle: "Manage your poultry assets and tokens",
            my_assets: "My Assets",
            expires_in: "Expires in",
            days: "days",
            assets_received: "Assets received from verified deliveries",
            transfer_assets: "Transfer Assets",
            asset_type: "Asset Type",
            select_asset: "Select Asset",
            chickens: "🐔 Chickens",
            eggs: "🥚 Eggs",
            send_to: "Send To",
            select_recipient: "Select Recipient",
            central_kitchen: "🍳 Central Kitchen",
            custom_address: "📝 Custom Address",
            recipient_address: "Recipient Address",
            quantity: "Quantity",
            send_assets: "Send Assets",
            burn_assets: "Burn/Dispose Assets",
            asset_status: "Asset Status",
            farm_location: "Farm Location A",
            chicken_coop: "Chicken Coop 1",
            active: "Active",
            last_verification: "Last Verification",
            hours_ago: "hours ago",
            verified: "✓ Verified",
            daily_production: "Daily Production",
            eggs_per_day: "~150 eggs/day",
            tracked: "📊 Tracked"
        },
        
        // Kitchen Section
        kitchen: {
            title: "Central Kitchen Dashboard",
            subtitle: "Place orders and manage ingredient procurement",
            budget_status: "Budget Status",
            active_orders: "Active Orders",
            available_budget: "Available Budget",
            budget_expires: "Budget expires in",
            spent_today: "Spent Today",
            last_transaction: "Last transaction completed successfully",
            place_order: "Place Order",
            select_supplier: "Select Supplier",
            choose_supplier: "Choose Supplier",
            happy_farm: "🚜 Happy Farm Supplier",
            order_items: "Order Items",
            budget_allocation: "Budget Allocation (tIDR)",
            order_deadline: "Order Deadline (Hours)",
            create_order: "Create Order",
            current_inventory: "Current Inventory",
            received_today: "Received Today"
        },
        
        // Authority Section
        authority: {
            title: "Central Authority Dashboard",
            subtitle: "Manage tokenization, verification and governance",
            mint_tokens: "Mint New Tokens",
            asset_type: "Asset Type",
            select_type: "Select Asset Type",
            physical_amount: "Physical Asset Amount",
            recipient_address: "Recipient Address",
            expiry_days: "Expiry (Days)",
            mint_tokens_btn: "Mint Tokens",
            verify_assets: "Verify Assets",
            pending_verification: "Pending Verification",
            supplier_name: "Supplier Name",
            asset_details: "Asset Details",
            verification_status: "Verification Status",
            approve: "Approve",
            reject: "Reject",
            under_review: "Under Review",
            governance: "Platform Governance",
            total_suppliers: "Total Suppliers",
            pending_requests: "Pending Requests",
            platform_fee: "Platform Fee",
            last_update: "Last Update",
            add_verifier: "Add New Verifier",
            verifier_address: "Verifier Address",
            assign_role: "Assign Role"
        },
        
        // Common Elements
        common: {
            loading: "Loading...",
            processing: "Processing transaction...",
            success: "Success",
            error: "Error", 
            transaction_completed: "Transaction completed successfully!",
            view_explorer: "View on Explorer",
            try_again: "An error occurred. Please try again.",
            close: "Close",
            submit: "Submit",
            cancel: "Cancel",
            connect_wallet: "Connect Wallet"
        },
        
        connection: {
            not_connected: "Not connected to local blockchain. Click to connect directly (no MetaMask needed).",
            connect_wallet: "Connect Wallet",
            connect_direct: "Connect Now",
            select_role: "Select Demo Role"
        },
        
        wallet: {
            select_demo_role: "Select Demo Role"
        }
    },
    
    id: {
        // Navigation
        nav: {
            dashboard: "Dasbor",
            farmers: "🚜 Petani",
            kitchens: "🍳 Dapur",
            authority: "👔 Otoritas"
        },
        
        // Connection Status
        connection: {
            not_connected: "Tidak terhubung ke blockchain lokal. Klik untuk terhubung langsung (tidak perlu MetaMask).",
            connect_wallet: "Hubungkan Dompet",
            connect_direct: "Hubungkan ke Blockchain Lokal",
            select_role: "Pilih Dompet Demo",
            connected: "Terhubung ke Web3",
            account: "Akun"
        },
        
        // Platform Status
        status: {
            platform_operational: "Status Platform: Beroperasi",
            platform_description: "Platform Tokenisasi Aset Pertanian telah sepenuhnya diterapkan dan beroperasi di Jaringan Hardhat.",
            deployed_contracts: "Kontrak yang Diterapkan",
            registered_suppliers: "Pemasok Terdaftar",
            completed_transactions: "Transaksi Selesai",
            network: "Jaringan"
        },
        
        // Dashboard
        dashboard: {
            platform_statistics: "Statistik Platform",
            total_minted: "Total Dicetak",
            budget_allocation: "Alokasi Anggaran",
            escrow_trade: "Perdagangan Escrow",
            completed: "Selesai",
            days_expiry: "hari kedaluwarsa",
            days_budget: "hari anggaran"
        },
        
        // Farmers Section
        farmers: {
            title: "Dasbor Petani Ayam",
            subtitle: "Kelola aset unggas dan token Anda",
            my_assets: "Aset Saya",
            expires_in: "Berakhir dalam",
            days: "hari",
            assets_received: "Aset diterima dari pengiriman terverifikasi",
            transfer_assets: "Transfer Aset",
            asset_type: "Jenis Aset",
            select_asset: "Pilih Aset",
            chickens: "🐔 Ayam",
            eggs: "🥚 Telur",
            send_to: "Kirim Ke",
            select_recipient: "Pilih Penerima",
            central_kitchen: "🍳 Dapur Pusat",
            custom_address: "📝 Alamat Khusus",
            recipient_address: "Alamat Penerima",
            quantity: "Jumlah",
            send_assets: "Kirim Aset",
            asset_status: "Status Aset",
            farm_location: "Lokasi Peternakan A",
            chicken_coop: "Kandang Ayam 1",
            active: "Aktif",
            last_verification: "Verifikasi Terakhir",
            hours_ago: "jam yang lalu",
            verified: "✓ Terverifikasi",
            daily_production: "Produksi Harian",
            eggs_per_day: "~150 telur/hari",
            tracked: "📊 Terlacak"
        },
        
        // Kitchen Section
        kitchen: {
            title: "Dasbor Dapur Pusat",
            subtitle: "Buat pesanan dan kelola pengadaan bahan",
            budget_status: "Status Anggaran",
            available_budget: "Anggaran Tersedia",
            budget_expires: "Anggaran berakhir dalam",
            spent_today: "Dihabiskan Hari Ini",
            last_transaction: "Transaksi terakhir berhasil diselesaikan",
            place_order: "Buat Pesanan",
            select_supplier: "Pilih Pemasok",
            choose_supplier: "Pilih Pemasok",
            happy_farm: "🚜 Pemasok Peternakan Bahagia",
            order_items: "Item Pesanan",
            budget_allocation: "Alokasi Anggaran (tIDR)",
            order_deadline: "Batas Waktu Pesanan (Jam)",
            create_order: "Buat Pesanan",
            current_inventory: "Inventaris Saat Ini",
            received_today: "Diterima Hari Ini"
        },
        
        // Authority Section
        authority: {
            title: "Dasbor Otoritas Pusat",
            subtitle: "Kelola tokenisasi, verifikasi dan tata kelola",
            mint_tokens: "Cetak Token Baru",
            asset_type: "Jenis Aset",
            select_type: "Pilih Jenis Aset",
            physical_amount: "Jumlah Aset Fisik",
            recipient_address: "Alamat Penerima",
            expiry_days: "Kedaluwarsa (Hari)",
            mint_tokens_btn: "Cetak Token",
            verify_assets: "Verifikasi Aset",
            pending_verification: "Menunggu Verifikasi",
            supplier_name: "Nama Pemasok",
            asset_details: "Detail Aset",
            verification_status: "Status Verifikasi",
            approve: "Setujui",
            reject: "Tolak",
            under_review: "Dalam Peninjauan",
            governance: "Tata Kelola Platform",
            total_suppliers: "Total Pemasok",
            pending_requests: "Permintaan Tertunda",
            platform_fee: "Biaya Platform",
            last_update: "Pembaruan Terakhir",
            add_verifier: "Tambah Verifikator Baru",
            verifier_address: "Alamat Verifikator",
            assign_role: "Tetapkan Peran"
        },
        
        // Common Elements
        common: {
            loading: "Memuat...",
            processing: "Memproses transaksi...",
            success: "Berhasil",
            error: "Kesalahan",
            transaction_completed: "Transaksi berhasil diselesaikan!",
            view_explorer: "Lihat di Explorer",
            try_again: "Terjadi kesalahan. Silakan coba lagi.",
            close: "Tutup",
            submit: "Kirim",
            cancel: "Batal",
            connect_wallet: "Hubungkan Dompet"
        },
        
        // Connection and Wallet
        connection: {
            not_connected: "Tidak terhubung ke blockchain lokal. Klik untuk terhubung langsung (tidak perlu MetaMask).",
            connect_wallet: "Hubungkan Dompet",
            connect_direct: "Hubungkan Sekarang",
            select_role: "Pilih Dompet Demo"
        },
        
        // Wallet
        wallet: {
            select_demo_role: "Pilih Peran Demo"
        }
    }
};

// Current language (default to English)
let currentLanguage = localStorage.getItem('language') || 'en';

// Translation function
function t(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            // Fallback to English if translation not found
            value = translations.en;
            for (const fallbackKey of keys) {
                if (value && value[fallbackKey]) {
                    value = value[fallbackKey];
                } else {
                    return key; // Return the key if no translation found
                }
            }
            break;
        }
    }
    
    return value || key;
}

// Function to change language
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateUI();
    
    // Update the language indicator
    const langIndicator = document.getElementById('currentLang');
    if (langIndicator) {
        langIndicator.textContent = lang.toUpperCase();
    }
}

// Function to update all UI elements with translations
function updateUI() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        // For input placeholders
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.placeholder) {
                element.placeholder = translation;
            }
        } else {
            element.textContent = translation;
        }
    });
    
    // Handle placeholder translations separately
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        element.placeholder = translation;
    });
}

// Initialize language system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set initial language indicator
    const langIndicator = document.getElementById('currentLang');
    if (langIndicator) {
        langIndicator.textContent = currentLanguage.toUpperCase();
    }
    
    // Apply translations
    updateUI();
});