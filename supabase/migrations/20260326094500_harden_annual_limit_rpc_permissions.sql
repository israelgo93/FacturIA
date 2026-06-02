-- =============================================
-- MIGRACION 017: Endurecer permisos de funcion auxiliar anual
-- =============================================

REVOKE ALL ON FUNCTION public.contar_documentos_anio(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.contar_documentos_anio(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.contar_documentos_anio(uuid, integer) FROM authenticated;
