require('dotenv').config();
const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

// FTP configuration for saberloop.com LLM proxy
const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    host: process.env.FTP_HOST,
    port: 21,
    forcePasv: true,
    secure: true,
    secureOptions: { rejectUnauthorized: false },
    localRoot: './php-api/llm',
    remoteRoot: '/llm',  // saberloop.com/llm/
    include: [
        '*.php',
        '*.example.php',
        '.htaccess',
        'src/**/*.php'
    ],
    exclude: [],
    deleteRemote: false
};

async function deploy() {
    try {
        console.log('🤖 Deploying LLM proxy to saberloop.com/llm/...');
        console.log('   Files: completion.php, health.php, .htaccess, src/**');
        await ftpDeploy.deploy(config);
        console.log('✅ LLM proxy deployed!');
        console.log('🔗 Health check: https://saberloop.com/llm/health.php');
        console.log('');
        console.log('📁 Deployed structure:');
        console.log('   - completion.php (main endpoint)');
        console.log('   - health.php (health check)');
        console.log('   - .htaccess (CORS config)');
        console.log('   - src/handlers/LLMCompletion.php');
        console.log('   - src/providers/*.php');
        console.log('   - src/utils/ResponseSanitizer.php');
        console.log('');
        console.log('⚠️  IMPORTANT - Verify deployment:');
        console.log('   1. Test health: curl https://saberloop.com/llm/health.php');
        console.log('   2. Check PHP error logs if issues occur');
    } catch (err) {
        console.error('❌ Deployment failed:', err);
        process.exit(1);
    }
}

deploy();
