// --- Supabase კონფიგურაცია ---
// ეს ფაილი შეიცავს Supabase-ის პროექტთან დასაკავშირებელ მონაცემებს.
// Supabase არის სერვისი, რომელსაც ვიყენებთ მონაცემთა ბაზისა და ფაილების შესანახად.

// Supabase-ის თქვენი პროექტის უნიკალური მისამართი (URL)
const SUPABASE_URL = 'https://mzlydlhjvlrvugkyduve.supabase.co';

// Supabase-ის პროექტის საჯარო გასაღები (Public Key).
// ეს გასაღები უსაფრთხოა და შეიძლება გამოყენებულ იქნას კლიენტის მხარეს (ბრაუზერში).
const SUPABASE_KEY = 'sb_publishable_zcIvAi44jfYTUCx_mQa0uA_e_k55o4m';

// Supabase კლიენტის შექმნა.
// ეს ობიექტი (_supabase) გამოიყენება მონაცემთა ბაზასთან ყველა ოპერაციისთვის.
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
