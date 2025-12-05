-- AlterTable: Adiciona limites ao Plan (apenas se a tabela existir)
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
      AND column_name = 'maxBranches'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "maxBranches" INTEGER;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'maxMembers'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "maxMembers" INTEGER;
    END IF;
  END IF;
END $$;
