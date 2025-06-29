// This function handles access requests, creates a unique token,
// stores it in Vercel KV, and emails it to the requester.
import { Resend } from 'resend';
import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // --- Standard CORS and Method Check ---
  const allowedOrigins = [
    'https://rahulkumareconomist-github-io.vercel.app',
    'https://rahulkumareconomist.github.io'
  ];
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    const { name, company, email } = request.body;

    if (!name || !company || !email) {
      return response.status(400).json({ error: 'Missing required fields.' });
    }

    // --- Token Generation Logic ---
    // 1. Generate a unique, random token (e.g., 'f8b1-a2c3-d4e5')
    const token = crypto.randomUUID().slice(0, 13).replace(/-/g, '').match(/.{1,4}/g).join('-');

    // 2. Connect to your Vercel KV store
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // 3. Store the token with a 24-hour expiration (86400 seconds)
    //    We store 'true' as the value, just to confirm it exists.
    await kv.set(token, 'valid', { ex: 86400 });

    // --- Email Notification Logic ---
    const resend = new Resend(process.env.RESEND_API_KEY);
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    // A. Email the token to the recruiter
    const recruiterSubject = `Access Token for Rahul Kumar Thakur's Resume`;
    const recruiterBody = `
      <p>Hello ${name},</p>
      <p>Thank you for your interest. Please use the following single-use access token to view the confidential details on my resume. This token is valid for 24 hours.</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px; background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">${token}</p>
      <p>You can enter this token on the resume page: <a href="https://rahulkumareconomist-github-io.vercel.app/resume.html">https://rahulkumareconomist-github-io.vercel.app/resume.html</a></p>
      <p>Best regards,<br>Rahul Kumar Thakur</p>
    `;
    await resend.emails.send({
        from: 'Resume Access <onboarding@resend.dev>',
        to: email, // Send to the recruiter's email
        subject: recruiterSubject,
        html: recruiterBody,
    });

    // B. Email a notification to yourself
    const selfSubject = `New Resume Access Request from ${name} at ${company}`;
    const selfBody = `<p>A new access token was generated and sent to ${name} at ${email}.</p><p>IP: ${ip}</p>`;
    await resend.emails.send({
        from: 'Portfolio Notifier <onboarding@resend.dev>',
        to: notificationEmail,
        subject: selfSubject,
        html: selfBody,
    });

    // --- Final Response ---
    console.log(`Token ${token} generated for ${email}`);
    return response.status(200).json({ success: true });

  } catch (error) {
    console.error('Request Access Error:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
