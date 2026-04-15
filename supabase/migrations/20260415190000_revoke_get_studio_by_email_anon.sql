-- Ne pas exposer get_studio_by_email_with_data (dont siret) aux appels anonymes.
-- Le dashboard et les Edge Functions utilisent le rôle authenticated ou service_role.

REVOKE EXECUTE ON FUNCTION public.get_studio_by_email_with_data(text) FROM anon;
