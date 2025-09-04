/**
 * Script para generar una clave de encriptación segura
 */

const crypto = require('crypto');

function generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Clave de encriptación generada:');
    console.log('');
    console.log(`ENCRYPTION_KEY=${key}`);
    console.log('');
    console.log('📝 Agrega esta línea a tu archivo .env');
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Guarda esta clave de forma segura');
    console.log('   - No la compartas ni la subas a repositorios públicos');
    console.log('   - Si la pierdes, no podrás desencriptar los tokens existentes');
    console.log('');
    console.log('✅ La clave es válida y lista para usar');
}

generateEncryptionKey();
