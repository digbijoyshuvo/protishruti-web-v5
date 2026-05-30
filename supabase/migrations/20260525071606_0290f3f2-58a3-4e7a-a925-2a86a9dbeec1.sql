
-- 1. Create trigger on auth.users so handle_new_user actually runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Wipe all existing app data
TRUNCATE TABLE
  public.audit_logs,
  public.alerts,
  public.document_drafts,
  public.verification_results,
  public.transactions,
  public.uploads,
  public.investor_profiles,
  public.shops,
  public.user_roles,
  public.profiles
RESTART IDENTITY CASCADE;
