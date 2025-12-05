/**
 * Script para corrigir todos os arquivos de teste para usar o enum SubscriptionStatus
 * em vez de strings como 'active', 'pending', 'canceled', etc.
 * 
 * IMPORTANTE: Query strings HTTP (ex: .query({ status: 'active' })) são mantidas como strings
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const TEST_DIR = join(process.cwd(), 'tests')

// Função para verificar se uma string está em contexto HTTP query (não deve ser alterada)
function isHttpQueryContext(content, matchIndex) {
  // Busca o contexto antes do match
  const beforeMatch = content.substring(Math.max(0, matchIndex - 200), matchIndex)
  const afterMatch = content.substring(matchIndex, Math.min(content.length, matchIndex + 50))
  
  // Se está dentro de .query({ ... }) ou .get().query(), mantém como string
  if (/\.query\s*\(\s*\{/.test(beforeMatch) || /\.query\s*\(\s*\{/.test(afterMatch)) {
    return true
  }
  
  // Se está em uma chamada HTTP direta com query string, mantém como string
  if (/\.(get|post|put|delete|patch)\([^)]*\)\s*\.query/.test(beforeMatch)) {
    return true
  }
  
  return false
}

function getAllTestFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir)

    files.forEach((file) => {
      const filePath = join(dir, file)
      const stat = statSync(filePath)

      if (stat.isDirectory()) {
        // Ignorar node_modules e outros diretórios
        if (!file.startsWith('.') && file !== 'node_modules') {
          getAllTestFiles(filePath, fileList)
        }
      } else if (
        (extname(file) === '.ts' || extname(file) === '.js') &&
        (file.endsWith('.test.ts') ||
          file.endsWith('.test.js') ||
          file.endsWith('.spec.ts') ||
          file.endsWith('.spec.js') ||
          dir.includes('tests'))
      ) {
        fileList.push(filePath)
      }
    })
  } catch (error) {
    // Diretório não existe, ignora
  }

  return fileList
}

function hasSubscriptionStatusImport(content) {
  return /import\s+.*SubscriptionStatus.*from\s+['"]@prisma\/client['"]/.test(content)
}

function needsSubscriptionStatusImport(content) {
  // Verifica se já importa SubscriptionStatus
  if (hasSubscriptionStatusImport(content)) {
    return false
  }

  // Verifica se usa status: 'active' ou similar (mas não em query HTTP)
  const statusMatches = content.matchAll(/status:\s*['"]active['"]/g)
  for (const match of statusMatches) {
    if (!isHttpQueryContext(content, match.index)) {
      return true
    }
  }

  return false
}

function addSubscriptionStatusImport(content) {
  // Verifica se já tem import do SubscriptionStatus
  if (hasSubscriptionStatusImport(content)) {
    return content
  }

  // Encontra imports existentes do @prisma/client
  const prismaClientImportRegex = /import\s+([^}]+)\s+from\s+['"]@prisma\/client['"];?/g
  const matches = [...content.matchAll(prismaClientImportRegex)]

  if (matches.length > 0) {
    // Adiciona SubscriptionStatus ao último import existente
    const lastMatch = matches[matches.length - 1]
    const importStatement = lastMatch[0]
    const imports = lastMatch[1]

    // Verifica se já tem SubscriptionStatus
    if (imports.includes('SubscriptionStatus')) {
      return content
    }

    // Adiciona SubscriptionStatus ao import
    let newImport
    if (imports.includes('{')) {
      // Se já tem múltiplos imports (ex: { Role, AdminRole })
      newImport = importStatement.replace(
        imports,
        imports.replace(/\{/, '{ SubscriptionStatus, ')
      )
    } else {
      // Se é um import único ou default
      if (imports.includes('type')) {
        // Se é type import
        newImport = importStatement.replace(
          /import\s+type\s+([^}]+)\s+from/,
          "import type { SubscriptionStatus, $1 } from"
        )
      } else {
        newImport = importStatement.replace(
          /import\s+([^}]+)\s+from/,
          'import { SubscriptionStatus, $1 } from'
        )
      }
    }

    return content.replace(importStatement, newImport)
  } else {
    // Não tem nenhum import do @prisma/client, adiciona novo
    const importStatement = "import { SubscriptionStatus } from '@prisma/client'\n"

    // Tenta inserir após os imports do dotenv
    const dotenvImportRegex = /^(import\s+.*from\s+['"]dotenv['"];?\n)/m
    if (dotenvImportRegex.test(content)) {
      return content.replace(dotenvImportRegex, '$1' + importStatement)
    }

    // Tenta inserir após comentários iniciais
    const commentMatch = content.match(/^(\/\/.*\n)*/)
    if (commentMatch) {
      const insertIndex = commentMatch[0].length
      return content.slice(0, insertIndex) + importStatement + content.slice(insertIndex)
    }

    // Último recurso: adiciona no início
    return importStatement + content
  }
}

function fixSubscriptionStatus(content) {
  let fixedContent = content
  let replacements = 0

  // Lista de status para corrigir
  const statuses = [
    { string: 'active', enum: 'SubscriptionStatus.active' },
    { string: 'pending', enum: 'SubscriptionStatus.pending' },
    { string: 'canceled', enum: 'SubscriptionStatus.canceled' },
    { string: 'past_due', enum: 'SubscriptionStatus.past_due' },
    { string: 'unpaid', enum: 'SubscriptionStatus.unpaid' },
    { string: 'trialing', enum: 'SubscriptionStatus.trialing' },
  ]

  for (const { string, enum: enumValue } of statuses) {
    // Padrão para encontrar status: 'string' ou status: "string"
    const pattern = new RegExp(`status:\\s*['"]${string}['"]`, 'g')
    
    // Encontra todas as ocorrências
    const matches = [...content.matchAll(pattern)]
    
    for (const match of matches) {
      const matchIndex = match.index
      
      // Ignora se está em contexto HTTP query
      if (isHttpQueryContext(fixedContent, matchIndex)) {
        continue
      }
      
      // Faz a substituição
      fixedContent = fixedContent.substring(0, matchIndex) +
        `status: ${enumValue}` +
        fixedContent.substring(matchIndex + match[0].length)
      
      replacements++
    }
  }

  return { content: fixedContent, replacements }
}

function fixFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')

    // Verifica se o arquivo usa status como string (fora de queries HTTP)
    let usesStatusString = false
    const statusMatches = content.matchAll(/status:\s*['"]active['"]|status:\s*['"]pending['"]|status:\s*['"]canceled['"]/g)
    for (const match of statusMatches) {
      if (!isHttpQueryContext(content, match.index)) {
        usesStatusString = true
        break
      }
    }

    if (!usesStatusString) {
      return null
    }

    let fixedContent = content
    let needsImport = needsSubscriptionStatusImport(fixedContent)

    // Adiciona import se necessário
    if (needsImport) {
      fixedContent = addSubscriptionStatusImport(fixedContent)
    }

    // Corrige as strings
    const { content: newContent, replacements } = fixSubscriptionStatus(fixedContent)

    if (replacements > 0 || needsImport) {
      writeFileSync(filePath, newContent, 'utf-8')
      return {
        path: filePath,
        needsImport,
        replacements,
      }
    }

    return null
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message)
    return null
  }
}

function main() {
  console.log('🔍 Buscando arquivos de teste...\n')

  const testFiles = getAllTestFiles(TEST_DIR)
  console.log(`📁 Encontrados ${testFiles.length} arquivos de teste\n`)

  const fixedFiles = []
  let totalReplacements = 0

  console.log('🔧 Corrigindo arquivos...\n')

  for (const file of testFiles) {
    const result = fixFile(file)
    if (result) {
      fixedFiles.push(result)
      totalReplacements += result.replacements
      const relativePath = file.replace(process.cwd(), '.')
      const importNote = result.needsImport ? ' + import adicionado' : ''
      console.log(`✅ ${relativePath}`)
      console.log(`   - ${result.replacements} substituições${importNote}`)
    }
  }

  console.log(`\n📊 Resumo:`)
  console.log(`   - Arquivos corrigidos: ${fixedFiles.length}`)
  console.log(`   - Total de substituições: ${totalReplacements}`)

  if (fixedFiles.length === 0) {
    console.log('\n✨ Nenhum arquivo precisou ser corrigido!')
  } else {
    console.log('\n✨ Correção concluída!')
    console.log('\n⚠️  Importante:')
    console.log('   1. Revise as alterações antes de fazer commit')
    console.log('   2. Use: git diff para ver as alterações')
    console.log('   3. Query strings HTTP foram preservadas como strings')
  }
}

main()
