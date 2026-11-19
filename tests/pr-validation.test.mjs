import { spawnSync } from 'node:child_process'
import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

register(new URL('./resolve-ts.mjs', import.meta.url))

const branch = 'LLT-285-validacao-de-prs'
const passedCommands = {
  ci: { ok: true, output: '' },
  test: { ok: true, output: '' },
  build: { ok: true, output: '' },
}

test('branch accepts LLT-XXX-slug and rejects the known bad names', async () => {
  const { BRANCH_FORMAT, checkBranch } = await import('../scripts/pr-validation.mjs')
  assert.equal(checkBranch(branch).ok, true)
  for (const name of ['LLT-285', 'LLT-285-', 'LLT-285--slug', 'LLT-285-Validacao', 'feature/LLT-285-validacao']) {
    const result = checkBranch(name)
    assert.equal(result.ok, false)
    assert.match(result.detail, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.match(result.detail, new RegExp(BRANCH_FORMAT))
  }
})

test('title must match the branch number and the single-space format', async () => {
  const { checkTitle } = await import('../scripts/pr-validation.mjs')
  assert.equal(checkTitle('LLT-285: especifica validação de PRs', '285').ok, true)
  for (const title of ['LLT-285:descricao', 'LLT-285:  descricao', 'LLT-285:   ']) {
    assert.equal(checkTitle(title, '285').ok, false)
  }
  const mismatch = checkTitle('LLT-286: outro número', '285')
  assert.equal(mismatch.ok, false)
  assert.match(mismatch.detail, /285/)
  assert.match(mismatch.detail, /286/)
})

test('commits keep another task number, ignore merges and cite the full hash', async () => {
  const { checkCommits } = await import('../scripts/pr-validation.mjs')
  const hash = '0123456789abcdef0123456789abcdef01234567'
  const inherited = checkCommits([{ sha: hash, message: 'LLT-167: convida usuário\n\ncorpo livre', parents: 1 }])
  assert.equal(inherited.ok, true)
  const invalid = checkCommits([{ sha: hash, message: 'ajusta sem prefixo', parents: 1 }])
  assert.equal(invalid.ok, false)
  assert.match(invalid.detail, new RegExp(hash))
  assert.match(invalid.detail, /ajusta sem prefixo/)
  const merge = checkCommits([{ sha: hash, message: 'mensagem qualquer', parents: 2 }])
  assert.equal(merge.ok, true)
  assert.equal(checkCommits([]).ok, true)
})

test('error excerpts stop at 30 lines and 1500 characters', async () => {
  const { clipExcerpt } = await import('../scripts/pr-validation.mjs')
  const manyLines = Array.from({ length: 31 }, (_, index) => `linha ${index + 1}`).join('\n')
  const clippedLines = clipExcerpt(manyLines)
  assert.match(clippedLines, /O trecho foi cortado\./)
  assert.match(clippedLines, /linha 31/)
  assert.equal(clippedLines.split('\n').filter((line) => line.startsWith('linha ')).length, 30)
  const longLine = 'x'.repeat(1501)
  const clippedChars = clipExcerpt(longLine)
  assert.match(clippedChars, /O trecho foi cortado\./)
  assert.ok(clippedChars.replace('\nO trecho foi cortado.', '').length <= 1500)
})

test('a failed install does not run test or build', async () => {
  const { commandChecks } = await import('../scripts/pr-validation.mjs')
  const checks = commandChecks({ ci: { ok: false, output: 'npm ci falhou' }, test: null, build: null })
  assert.equal(checks.find((item) => item.name === 'npm ci').ok, false)
  for (const name of ['npm test', 'npm run build']) {
    const check = checks.find((item) => item.name === name)
    assert.equal(check.ok, false)
    assert.match(check.detail, /Não rodaram/)
  }
})

test('a pull request into main checks only install, tests and build', async () => {
  const { RELEASE_NOTE, buildComment } = await import('../scripts/pr-validation.mjs')
  const body = buildComment({
    base: 'main',
    branch: 'qualquer',
    title: 'sem formato',
    commits: [{ sha: 'abc', message: 'mensagem livre', parents: 1 }],
    commands: passedCommands,
  })
  assert.match(body, new RegExp(RELEASE_NOTE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(body, /✅ npm ci/)
  assert.match(body, /✅ npm test/)
  assert.match(body, /✅ npm run build/)
  assert.doesNotMatch(body, /[✅❌] branch/)
  assert.doesNotMatch(body, /[✅❌] título/)
  assert.doesNotMatch(body, /[✅❌] commits/)
})

test('the comment lists six checks and the copy block only includes failures', async () => {
  const { MARKER, buildComment } = await import('../scripts/pr-validation.mjs')
  const clean = buildComment({
    branch,
    title: 'LLT-285: especifica validação de PRs',
    commits: [{ sha: 'abc', message: 'LLT-167: convida usuário', parents: 1 }],
    commands: passedCommands,
  })
  assert.equal(clean.startsWith(MARKER), true)
  for (const name of ['branch', 'título', 'commits', 'npm ci', 'npm test', 'npm run build']) {
    assert.match(clean, new RegExp(`[✅❌] ${name}`))
  }
  assert.match(clean, /Para corrigir com IA/)
  assert.match(clean.split('Para corrigir com IA')[1], /Não há nada para corrigir\./)

  const hash = 'fedcba9876543210fedcba9876543210fedcba98'
  const failed = buildComment({
    branch,
    title: 'LLT-286: outro número',
    commits: [{ sha: hash, message: 'LLT-167: convida usuário', parents: 1 }],
    commands: { ci: { ok: true, output: '' }, test: { ok: false, output: 'falha no teste' }, build: { ok: true, output: '' } },
  })
  const block = failed.split('Para corrigir com IA')[1]
  assert.match(block, /título/)
  assert.match(block, /encontrado: LLT-286: outro número/)
  assert.match(block, /esperado: LLT-XXX: descricao/)
  assert.match(block, /npm test/)
  assert.match(block, /falha no teste/)
  assert.doesNotMatch(block, /npm ci/)
  assert.doesNotMatch(block, /npm run build/)
  assert.equal(failed.includes('✅ commits'), true)
})

test('rerun accepts only test and /test, ignoring surrounding whitespace', async () => {
  const { isRerunCommand } = await import('../scripts/pr-validation.mjs')
  for (const body of ['test', '/test', ' test ', '\n/test\n', '\t/test\t', 'test\r\n']) {
    assert.equal(isRerunCommand(body), true, body)
  }
  for (const body of ['Test', '/Test', 'testar', 'test por favor', 't e s t', 'testing', '/test now', 'retest', '', '  ', null, '`test`']) {
    assert.equal(isRerunCommand(body), false, String(body))
  }
})

test('rerun permission is owner, member or collaborator', async () => {
  const { canRequestRerun } = await import('../scripts/pr-validation.mjs')
  for (const association of ['OWNER', 'MEMBER', 'COLLABORATOR']) {
    assert.equal(canRequestRerun(association), true, association)
  }
  for (const association of ['CONTRIBUTOR', 'NONE', 'FIRST_TIME_CONTRIBUTOR', 'FIRST_TIMER', 'MANNEQUIN', 'owner', 'member', '', null]) {
    assert.equal(canRequestRerun(association), false, String(association))
  }
})

test('bots and the validation action cannot request a rerun', async () => {
  const { shouldRerun } = await import('../scripts/pr-validation.mjs')
  const accepted = { body: 'test', association: 'OWNER', user: { type: 'User', login: 'alguem' } }
  assert.equal(shouldRerun(accepted), true)
  assert.equal(shouldRerun({ ...accepted, body: ' /test ' }), true)
  assert.equal(shouldRerun({ ...accepted, user: { type: 'Bot', login: 'github-actions[bot]' } }), false)
  assert.equal(shouldRerun({ ...accepted, user: { type: 'User', login: 'github-actions[bot]' } }), false)
  assert.equal(shouldRerun({ ...accepted, user: { type: 'User', login: 'dependabot[bot]' } }), false)
  assert.equal(shouldRerun({ ...accepted, association: 'CONTRIBUTOR' }), false)
  assert.equal(shouldRerun({ ...accepted, body: 'testar' }), false)
  assert.equal(shouldRerun({ body: 'test', association: 'MEMBER' }), true)
})

test('a passing validation comment uses rocket and a failing one uses -1', async () => {
  const { buildComment, rerunReaction } = await import('../scripts/pr-validation.mjs')
  const passed = buildComment({
    branch,
    title: 'LLT-285: especifica validação de PRs',
    commits: [{ sha: 'abc', message: 'LLT-167: convida usuário', parents: 1 }],
    commands: passedCommands,
  })
  assert.equal(rerunReaction(passed), 'rocket')
  const failed = buildComment({
    branch,
    title: 'LLT-285: especifica validação de PRs',
    commits: [{ sha: 'abc', message: 'LLT-167: convida usuário', parents: 1 }],
    commands: { ci: { ok: true, output: '' }, test: { ok: false, output: 'falha no teste' }, build: { ok: true, output: '' } },
  })
  assert.equal(rerunReaction(failed), '-1')
  assert.equal(rerunReaction(''), '-1')
  assert.equal(rerunReaction(null), '-1')
})

test('the gate command reports rerun and always exits zero', () => {
  const script = fileURLToPath(new URL('../scripts/pr-validation.mjs', import.meta.url))
  const accepted = spawnSync(process.execPath, [script, '--gate'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      COMMENT_BODY: ' /test ',
      AUTHOR_ASSOCIATION: 'COLLABORATOR',
      AUTHOR_TYPE: 'User',
      AUTHOR_LOGIN: 'alguem',
      GITHUB_OUTPUT: '',
    },
  })
  assert.equal(accepted.status, 0)
  assert.equal(accepted.stdout, 'rerun=true\n')
  const rejected = spawnSync(process.execPath, [script, '--gate'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      COMMENT_BODY: 'test',
      AUTHOR_ASSOCIATION: 'NONE',
      AUTHOR_TYPE: 'User',
      AUTHOR_LOGIN: 'alguem',
      GITHUB_OUTPUT: '',
    },
  })
  assert.equal(rejected.status, 0)
  assert.equal(rejected.stdout, 'rerun=false\n')
})
