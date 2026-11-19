import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const MARKER = '<!-- llt-285-validacao-prs -->'
export const RELEASE_NOTE = 'PR de release (Development → main): só testes e build são verificados'
export const BRANCH_FORMAT = 'LLT-XXX-slug'
export const TITLE_FORMAT = 'LLT-XXX: descricao'
const BRANCH_PATTERN = /^LLT-(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)$/
const TEXT_PATTERN = /^LLT-(\d+): (.*)$/

function firstLine(value) {
  return String(value ?? '').split(/\r?\n/, 1)[0]
}

function textMatch(value) {
  const line = firstLine(value)
  const match = TEXT_PATTERN.exec(line)
  if (!match || match[2].startsWith(' ') || match[2].trim() === '') return null
  return { number: match[1], line }
}

export function checkBranch(name) {
  const found = String(name ?? '')
  const match = BRANCH_PATTERN.exec(found)
  if (!match) {
    return {
      name: 'branch',
      ok: false,
      number: null,
      found,
      expected: BRANCH_FORMAT,
      excerpt: '',
      detail: `encontrado ${found}; esperado ${BRANCH_FORMAT}`,
    }
  }
  return { name: 'branch', ok: true, number: match[1], found, expected: BRANCH_FORMAT, excerpt: '', detail: '' }
}

export function checkTitle(title, branchNumber) {
  const found = firstLine(title)
  const match = textMatch(found)
  if (!match) {
    return {
      name: 'título',
      ok: false,
      number: null,
      found,
      expected: TITLE_FORMAT,
      excerpt: '',
      detail: `encontrado ${found}; esperado ${TITLE_FORMAT}`,
    }
  }
  if (branchNumber !== null && match.number !== branchNumber) {
    return {
      name: 'título',
      ok: false,
      number: match.number,
      found,
      expected: TITLE_FORMAT,
      excerpt: '',
      detail: `encontrado ${found}; esperado ${TITLE_FORMAT}; números ${branchNumber} e ${match.number}`,
    }
  }
  return { name: 'título', ok: true, number: match.number, found, expected: TITLE_FORMAT, excerpt: '', detail: '' }
}

export function checkCommits(commits) {
  const failures = []
  for (const commit of commits ?? []) {
    const parents = Array.isArray(commit.parents) ? commit.parents.length : Number(commit.parents ?? 0)
    if (parents > 1) continue
    const line = firstLine(commit.message)
    if (!textMatch(line)) failures.push({ hash: String(commit.sha ?? ''), line })
  }
  if (failures.length === 0) {
    return { name: 'commits', ok: true, found: '', expected: TITLE_FORMAT, excerpt: '', detail: '' }
  }
  const detail = failures.map((item) => `${item.hash} ${item.line}`).join('; ')
  return {
    name: 'commits',
    ok: false,
    found: detail,
    expected: TITLE_FORMAT,
    excerpt: '',
    detail,
  }
}

export function clipExcerpt(output) {
  const raw = String(output ?? '')
  const lines = raw.split(/\r?\n/)
  const overLines = lines.length > 30
  let text = (overLines ? lines.slice(-30) : lines).join('\n')
  const overChars = text.length > 1500
  if (overChars) text = text.slice(-1500)
  if (overLines || overChars) return `${text}\nO trecho foi cortado.`
  return text
}

function commandCheck(name, command, result, skipped) {
  if (skipped) {
    return {
      name,
      ok: false,
      found: 'não executado',
      expected: command,
      excerpt: '',
      detail: 'Não rodaram porque a instalação falhou.',
    }
  }
  if (result?.ok) return { name, ok: true, found: '', expected: command, excerpt: '', detail: '' }
  const excerpt = clipExcerpt(result?.output ?? '')
  return {
    name,
    ok: false,
    found: command,
    expected: `${command} conclui`,
    excerpt,
    detail: [`comando ${command}`, excerpt].filter(Boolean).join('\n'),
  }
}

export function commandChecks(commands = {}) {
  const ciOk = Boolean(commands.ci?.ok)
  return [
    commandCheck('npm ci', 'npm ci', commands.ci, false),
    commandCheck('npm test', 'npm test', commands.test, !ciOk),
    commandCheck('npm run build', 'npm run build', commands.build, !ciOk),
  ]
}

export function evaluate(input) {
  const branch = checkBranch(input.branch)
  const title = checkTitle(input.title, branch.number)
  const commits = checkCommits(input.commits)
  return [branch, title, commits, ...commandChecks(input.commands)]
}

function fixText(check) {
  const parts = [`- ${check.name}`]
  if (check.found) parts.push(`encontrado: ${check.found}`)
  if (check.expected) parts.push(`esperado: ${check.expected}`)
  if (check.excerpt) parts.push(`trecho:\n${check.excerpt}`)
  return parts.join('\n')
}

export function buildComment(input) {
  const release = input.base === 'main'
  const checks = release ? commandChecks(input.commands) : evaluate(input)
  const lines = [MARKER, '']
  if (release) lines.push(RELEASE_NOTE, '')
  for (const check of checks) {
    lines.push(`${check.ok ? '✅' : '❌'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`)
  }
  lines.push('', 'Para corrigir com IA', '')
  const failed = checks.filter((check) => !check.ok)
  if (failed.length === 0) lines.push('Não há nada para corrigir.')
  else lines.push('```text', ...failed.map(fixText), '```')
  return `${lines.join('\n')}\n`
}

function readOptional(file) {
  if (!file) return ''
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

export function inputFromEnv(env = process.env) {
  return {
    base: env.PR_BASE ?? '',
    branch: env.PR_BRANCH ?? '',
    title: env.PR_TITLE ?? '',
    commits: JSON.parse(readFileSync(env.PR_COMMITS_FILE, 'utf8')),
    commands: {
      ci: { ok: env.CI_CODE === '0', output: readOptional(env.CI_OUT) },
      test: env.TEST_RAN === '1' ? { ok: env.TEST_CODE === '0', output: readOptional(env.TEST_OUT) } : null,
      build: env.BUILD_RAN === '1' ? { ok: env.BUILD_CODE === '0', output: readOptional(env.BUILD_OUT) } : null,
    },
  }
}

function main() {
  try {
    const output = process.argv[3]
    const body = buildComment(process.argv[2] === '--env' ? inputFromEnv() : JSON.parse(readFileSync(process.argv[2], 'utf8')))
    if (output) writeFileSync(output, body)
    else process.stdout.write(body)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Falha ao montar o comentário.'}\n`)
  }
  process.exit(0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
