import { applyD1Migrations, env } from 'cloudflare:test'

// 各テストファイルの実行前にマイグレーションを適用する。
// isolatedStorage が有効なため、各テストでの書き込みはテスト終了時に巻き戻される。
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
