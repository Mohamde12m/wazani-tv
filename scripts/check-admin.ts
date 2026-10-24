import { createClient } from "@libsql/client";
const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";
const client = createClient({ url, authToken: token });
const res = await client.execute(`SELECT email, name, role, substr(passwordHash, 1, 30) as hash_preview FROM "AdminUser"`);
for (const r of res.rows) {
  console.log(`  📧 البريد: ${r.email}`);
  console.log(`  👤 الاسم: ${r.name}`);
  console.log(`  🎭 الدور: ${r.role}`);
  console.log(`  🔒 كلمة المرور (مشفرة bcrypt): ${r.hash_preview}...`);
}
