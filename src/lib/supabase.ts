import { createClient } from '@supabase/supabase-js';

/**
 * The publishable ("anon") key is meant to be embedded in client code — it's
 * safe to ship because every table it can touch is protected by Row Level
 * Security, and every Jeopardy mutation goes through SECURITY DEFINER RPCs
 * that check a bearer secret before doing anything (see the jeopardy_*
 * migrations). There is no separate secret to keep out of the bundle.
 */
const SUPABASE_URL = 'https://xxlrpkspkvukddhbluap.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_MDcEOQytBkBbTSuLNno9eQ_-FC-UJuY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
