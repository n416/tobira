import { hash } from 'bcryptjs';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as readline from 'readline';
const args = process.argv.slice(2);
const command = args[0];
function printUsage() {
    console.log('\nUsage: npx tsx scripts/manage-admin.ts <command> [args]');
    console.log('  create <email> <password>  Create OR Update admin (Upsert)');
    console.log('  delete <email>             Delete admin completely');
    process.exit(1);
}
if (!command)
    printUsage();
async function main() {
    const email = args[1];
    if (!email)
        printUsage();
    let sql = '';
    let actionName = '';
    const timestamp = Math.floor(Date.now() / 1000);
    // --- SQL生成ロジック ---
    if (command === 'create') {
        const password = args[2];
        if (!password) {
            console.error('Error: Password required');
            process.exit(1);
        }
        const pwHash = await hash(password, 10);
        // 新規作成時のみ使われるID
        const userId = crypto.randomUUID();
        actionName = `Upsert Admin (${email})`;
        // 【最強のSQL】
        // 1. users: 重複があればパスワードと更新日時だけ上書き。IDと作成日時は維持。
        // 2. admins: 重複があればパスワードだけ上書き。
        sql = `
      INSERT INTO users (id, email, password_hash, created_at, updated_at) 
      VALUES ('${userId}', '${email}', '${pwHash}', ${timestamp}, ${timestamp})
      ON CONFLICT(email) DO UPDATE SET 
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at;

      INSERT INTO admins (email) 
      VALUES ('${email}')
      ON CONFLICT(email) DO NOTHING;
    `.replace(/\n/g, ' ');
    }
    else if (command === 'delete') {
        actionName = `Delete Admin (${email})`;
        sql = `DELETE FROM admins WHERE email = '${email}'; DELETE FROM users WHERE email = '${email}';`;
    }
    else if (command === 'reset') {
        // createが兼ねるので本来不要だが、明示的にパスワード変えたい人用
        const password = args[2];
        if (!password) {
            console.error('Error: Password required');
            process.exit(1);
        }
        const pwHash = await hash(password, 10);
        actionName = `Reset Password (${email})`;
        sql = `UPDATE users SET password_hash = '${pwHash}', updated_at = ${timestamp} WHERE email = '${email}'; `.replace(/\n/g, ' ');
    }
    else {
        printUsage();
    }
    // 一時ファイルに保存
    const filename = 'temp_admin_query.sql';
    fs.writeFileSync(filename, sql);
    // --- 対話モード ---
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.log(`\n🤖 Action: ${actionName}`);
    console.log('Where do you want to apply this?');
    console.log('  [1] Local (Development)');
    console.log('  [2] Remote (Production)');
    console.log('  [3] Both');
    console.log('  [0] Cancel');
    rl.question('\nSelect [1-3]: ', (answer) => {
        rl.close();
        const targets = [];
        if (answer === '1' || answer === '3')
            targets.push('local');
        if (answer === '2' || answer === '3')
            targets.push('remote');
        if (targets.length === 0) {
            console.log('Cancelled.');
            if (fs.existsSync(filename))
                fs.unlinkSync(filename);
            return;
        }
        console.log('');
        // 実行ループ
        for (const target of targets) {
            const isRemote = target === 'remote';
            const flag = isRemote ? '--remote' : '';
            const envName = isRemote ? 'PRODUCTION' : 'LOCAL';
            console.log(`🚀 Executing on ${envName}...`);
            try {
                execSync(`npx wrangler d1 execute tobira-db ${flag} --file ${filename}`, { stdio: 'inherit' });
                console.log(`✅ Success on ${envName}`);
            }
            catch (e) {
                console.error(`❌ Failed on ${envName}`);
            }
            console.log('-----------------------------------');
        }
        // 後始末
        if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }
        console.log('Done.');
    });
}
main();
