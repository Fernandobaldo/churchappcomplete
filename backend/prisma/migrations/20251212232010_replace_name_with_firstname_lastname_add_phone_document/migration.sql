-- Step 1: Add new columns as nullable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "document" TEXT;

-- Step 2: Migrate data from name to firstName and lastName
-- Split name into firstName (first word) and lastName (rest)
UPDATE "User" 
SET 
  "firstName" = TRIM(SPLIT_PART("name", ' ', 1)),
  "lastName" = CASE 
    WHEN POSITION(' ' IN "name") > 0 THEN
      TRIM(SUBSTRING("name" FROM POSITION(' ' IN "name") + 1))
    ELSE
      TRIM(SPLIT_PART("name", ' ', 1))
  END
WHERE "firstName" IS NULL AND "name" IS NOT NULL;

-- Step 3: Set default values for any remaining NULLs (shouldn't happen, but safety check)
UPDATE "User" 
SET "firstName" = 'Usuário', "lastName" = ''
WHERE "firstName" IS NULL OR "firstName" = '';

-- Step 4: Make firstName and lastName NOT NULL (after data migration)
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 5: Remove the old name column
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";
