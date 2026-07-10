const SUPABASE_URL = "https://yfgstgtcreilfgohfscs.supabase.co";

const SUPABASE_KEY = "sb_publishable_kKX0CGxzEoQfOt6PRPSOeA_voCz5Z4A";

// A biblioteca expõe window.supabase
const { createClient } = window.supabase;

// Nosso cliente terá outro nome
const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
