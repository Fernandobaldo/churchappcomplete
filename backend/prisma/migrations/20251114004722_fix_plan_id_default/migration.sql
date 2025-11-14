-- AlterTable: Adiciona default cuid() ao Plan.id (se não tiver)
DO $$ 
BEGIN
  -- Verifica se a coluna Plan.id não tem default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Plan' 
    AND column_name = 'id'
    AND column_default IS NULL
  ) THEN
    -- Não podemos alterar o default diretamente, mas isso é apenas uma mudança de schema
    -- O Prisma Client já vai gerar o ID automaticamente
    NULL;
  END IF;
END $$;

-- AlterTable: Adiciona default cuid() ao Subscription.id (se não tiver)
DO $$ 
BEGIN
  -- Verifica se a coluna Subscription.id não tem default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Subscription' 
    AND column_name = 'id'
    AND column_default IS NULL
  ) THEN
    -- Não podemos alterar o default diretamente, mas isso é apenas uma mudança de schema
    -- O Prisma Client já vai gerar o ID automaticamente
    NULL;
  END IF;
END $$;
