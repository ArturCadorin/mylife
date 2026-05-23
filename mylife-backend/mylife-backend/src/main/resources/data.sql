-- ============================================================
-- Migrations manuais para ddl-auto=update
-- H2 não altera nullability de colunas existentes via Hibernate,
-- então rodamos aqui. Os ALTERs são idempotentes.
-- ============================================================

-- savings: cdi_rate e current_cdi_value passaram a ser opcionais
ALTER TABLE IF EXISTS tb_savings ALTER COLUMN cdi_rate DROP NOT NULL;
ALTER TABLE IF EXISTS tb_savings ALTER COLUMN current_cdi_value DROP NOT NULL;
