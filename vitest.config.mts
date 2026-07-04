import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.resolve(import.meta.dirname, 'migrations'))

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          // マイグレーションSQLをバインディング経由でsetupファイルへ渡す
          // JWT_SECRETはwrangler.tomlから削除したためテスト用の値をここで注入する
          bindings: { TEST_MIGRATIONS: migrations, JWT_SECRET: 'test_secret' },
        },
      }),
    ],
    test: {
      setupFiles: ['./test/apply-migrations.ts'],
    },
  }
})
