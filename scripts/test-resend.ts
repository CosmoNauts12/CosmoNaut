import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const apiKeyMatch = envContent.match(/RESEND_API_KEY=([^\s]+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].replace(/"/g, '') : null;

console.log('Using API Key (partial):', apiKey ? `${apiKey.substring(0, 7)}...` : 'MISSING');

if (!apiKey) {
    console.error('Error: RESEND_API_KEY is not set in .env.local');
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
    const testEmail = 'dharishniprakash@gmail.com'; // User's email from curl attempt

    console.log(`Attempting to send test email to ${testEmail}...`);

    const { data, error } = await resend.emails.send({
        from: "CosmoNauts <onboarding@resend.dev>",
        to: [testEmail],
        subject: "Test Email from CosmoNauts",
        html: "<h1>It works!</h1><p>This is a test email to verify Resend integration.</p>"
    });

    if (error) {
        console.error('Resend Error Details:', JSON.stringify(error, null, 2));
        if (error.name === 'validation_error' || error.message?.includes('unauthorized')) {
            console.log('\nTIP: If you are using a free Resend account, you can only send emails to the address you used to sign up (or verified emails) until you add a custom domain.');
        }
    } else {
        console.log('Success!', data);
    }
}

testEmail();
