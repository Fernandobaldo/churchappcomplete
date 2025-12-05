-- AlterTable: Adiciona campo isActive ao Plan (apenas se a tabela existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Plan'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'isActive'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
  END IF;
END $$;



