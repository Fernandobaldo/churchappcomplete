/**
 * Script Node.js para aplicar logTestResponse em todos os testes
 * 
 * Uso: node tests/utils/applyHelperToAllTests.js
 * 
 * Este script:
 * 1. Encontra todos os arquivos .test.ts em tests/integration
 * 2. Adiciona o import do helper se não existir
 * 3. Adiciona logTestResponse antes de cada expect(response.status).toBe(X)
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

const testFiles = glob.sync('tests/integration/**/*.test.ts', { cwd: path.join(__dirname, '../..') })

console.log(`Encontrados ${testFiles.length} arquivos de teste`)

testFiles.forEach(file => {
  const fullPath = path.join(__dirname, '../..', file)
  let content = fs.readFileSync(fullPath, 'utf8')
  let modified = false
  
  // 1. Adicionar import se não existir
  if (!content.includes('logTestResponse')) {
    // Encontrar onde adicionar o import (depois dos outros imports de utils)
    const importMatch = content.match(/(import.*from ['"]\.\.\/utils\/[^'"]+['"];?\n)/)
    if (importMatch) {
      const insertPos = importMatch.index + importMatch[0].length
      content = content.slice(0, insertPos) + 
                "import { logTestResponse } from '../utils/testResponseHelper'\n" +
                content.slice(insertPos)
      modified = true
    }
  }
  
  // 2. Adicionar logTestResponse antes de expect(response.status).toBe(X)
  // Padrão: expect(response.status).toBe(XXX)
  content = content.replace(
    /(\s+)(expect\(response\.status\)\.toBe\((\d+)\))/g,
    (match, indent, expectLine, status) => {
      return `${indent}logTestResponse(response, ${status})\n${indent}${expectLine}`
    }
  )
  
  // 3. Adicionar logTestResponse antes de expect(response.statusCode).toBe(X)
  // Padrão: expect(response.statusCode).toBe(XXX)
  content = content.replace(
    /(\s+)(expect\(response\.statusCode\)\.toBe\((\d+)\))/g,
    (match, indent, expectLine, status) => {
      return `${indent}logTestResponse(response, ${status})\n${indent}${expectLine}`
    }
  )
  
  if (modified || content !== fs.readFileSync(fullPath, 'utf8')) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ Atualizado: ${file}`)
  } else {
    console.log(`⏭️  Já atualizado: ${file}`)
  }
})

console.log('\n✅ Concluído!')


