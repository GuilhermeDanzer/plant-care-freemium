/**
 * Creates (or reuses) the App Review demo account on the linked Supabase
 * project and seeds it with a small deterministic garden, so Apple reviewers
 * can sign in and see a populated app immediately.
 *
 * Usage:
 *   node scripts/create-demo-account.mjs
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY from
 * .env (or the environment). Uses the publishable (anon) key + Supabase Auth,
 * so plants are inserted through RLS as the demo user themselves.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "appreview@planthelper.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

// Minimal .env loader (no dependency on dotenv).
function loadEnv() {
  const envPath = new URL("../.env", import.meta.url).pathname;
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anon) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
  process.exit(1);
}

if (!DEMO_PASSWORD) {
  console.error(
    "DEMO_PASSWORD is not set. Provide it via the environment, e.g.:\n" +
      "  DEMO_PASSWORD='...' node scripts/create-demo-account.mjs\n" +
      "Never commit real credentials to the repository.",
  );
  process.exit(1);
}

const supabase = createClient(url, anon);

const now = new Date().toISOString();
const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const seedPlants = (userId) => [
  {
    id: randomUUID(),
    user_id: userId,
    nickname: "Living Room",
    original_name: "Monstera",
    scientific_name: "Monstera deliciosa",
    watering_freq_days: 7,
    last_watered_at: now,
    next_watering_at: inAWeek,
    image_uri: null,
    health_data: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: randomUUID(),
    user_id: userId,
    nickname: "Kitchen Buddy",
    original_name: "Golden Pothos",
    scientific_name: "Epipremnum aureum",
    watering_freq_days: 5,
    last_watered_at: now,
    next_watering_at: inAWeek,
    image_uri: null,
    health_data: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

async function main() {
  // 1. Try to sign up. If the account already exists, fall back to sign-in.
  let session = null;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signUpError) {
    console.log("[demo] signUp failed:", signUpError.message);
    console.log("[demo] Attempting sign-in (account may already exist)...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (error) {
      console.error("[demo] sign-in failed:", error.message);
      process.exit(1);
    }
    session = data.session;
  } else if (signUpData.session) {
    session = signUpData.session;
  } else {
    console.warn(
      "[demo] Sign-up created a user but no session was returned — email " +
        "confirmation is likely enabled. Confirm the email (or disable " +
        "'Confirm email' in Auth → Providers → Email) and re-run."
    );
    process.exit(1);
  }

  const user = session.user;
  console.log(`[demo] Authenticated as ${user.email} (${user.id})`);

  // 2. Seed plants through RLS (the demo user inserts their own rows).
  const plants = seedPlants(user.id);
  const { error: plantsError } = await supabase.from("plants").upsert(plants);
  if (plantsError) {
    console.error("[demo] Failed to seed plants:", plantsError.message);
  } else {
    console.log(`[demo] Seeded ${plants.length} plant(s).`);
  }

  // 3. Ensure a profile row exists (idempotent upsert).
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    care_streak: 2,
    last_action_date: now,
    updated_at: now,
  });
  if (profileError) {
    console.error("[demo] Failed to seed profile:", profileError.message);
  } else {
    console.log("[demo] Seeded profile.");
  }

  console.log("\n=== App Review demo account ===");
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log("==============================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
