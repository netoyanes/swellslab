-- Phase 7: Team management
-- No schema changes required — profiles table already handles studio roles.
-- This phase adds:
--   • Proper email invitations via Supabase inviteUserByEmail (sends real invite email)
--   • /studio/settings/team page for master to manage team members
--   • Staff can be invited with admin or staff roles
--
-- Optional: ensure profiles has full_name for display in team list
alter table public.profiles
  add column if not exists full_name text;
