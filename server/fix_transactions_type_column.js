const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'payments'
  });

  await conn.execute("ALTER TABLE transactions CHANGE COLUMN `ype` `type` VARCHAR(255) NOT NULL DEFAULT 'payment'");
  const [rows] = await conn.execute(
    "SELECT CONCAT('[', COLUMN_NAME, ']') AS col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='payments' AND TABLE_NAME='transactions' ORDER BY ORDINAL_POSITION"
  );

  console.log('Columns after rename:');
  console.log(rows.map((r) => r.col).join('\n'));
  await conn.end();
})();
