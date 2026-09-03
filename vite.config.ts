import { defineConfig } from 'vite-plus'

// evals/fixtures/** 是评测输入素材（含故意埋入的缺陷，如 webhook-svc 的 eval RCE），
// 与 vendor/** 同理不做 lint/fmt；vitest 侧的排除见下方 test.exclude。
const ignorePatterns = [
  'pnpm-workspace.yaml',
  '**/*-lock.*',
  '__*',
  'vendor/**',
  'evals/fixtures/**',
]

export default defineConfig({
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: [...ignorePatterns],
  },
  fmt: {
    singleQuote: true,
    semi: false,
    arrowParens: 'avoid',
    ignorePatterns: [...ignorePatterns],
  },
  staged: {
    '*': 'vp check --no-error-on-unmatched-pattern',
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/__*/**',
      'projects/**',
      'vendor/**',
      'evals/fixtures/**',
      'evals/runs/**',
    ],
    // spawn bash/python 的进程级测试在并发下明显慢于 5s 默认超时
    testTimeout: 120_000,
  },
})
