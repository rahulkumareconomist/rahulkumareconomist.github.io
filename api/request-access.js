// This Vercel serverless function includes robust error checking.
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

  // --- Check for all required Environment Variables FIRST ---
  const { RESEND_API_KEY, NOTIFICATION_EMAIL, KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!RESEND_API_KEY || !NOTIFICATION_EMAIL || !KV_REST_API_URL || !KV_REST_API_TOKEN) {
      console.error("Server Configuration Error: Missing one or more environment variables.");
      return response.status(500).json({ error: 'Server is not configured correctly. Please contact the administrator.' });
  }

  try {
    const { name, company, email } = request.body;
    if (!name || !company || !email) {
      return response.status(400).json({ error: 'Missing required fields.' });
    }

    // --- Token Generation Logic ---
    const token = crypto.randomUUID().slice(0, 13).replace(/-/g, '').match(/.{1,4}/g).join('-');
    const kv = createClient({
      url: KV_REST_API_URL,
      token: KV_REST_API_TOKEN,
    });
    await kv.set(token, 'valid', { ex: 86400 });

    // --- Email Notification Logic ---
    const resend = new Resend(RESEND_API_KEY);
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    // A. Email the token to the recruiter
    const recruiterSubject = `Access Token for Rahul Kumar Thakur's Resume`;
    const recruiterBody = `<p>Hello ${name},</p><p>Thank you for your interest. Please use the following single-use access token to view the confidential details on my resume. This token is valid for 24 hours.</p><p style="font-size: 20px; font-weight: bold; letter-spacing: 2px; background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">${token}</p><p>You can enter this token on the resume page: <a href="https://rahulkumareconomist-github-io.vercel.app/resume.html">https://rahulkumareconomist-github-io.vercel.app/resume.html</a></p><p>Best regards,<br>Rahul Kumar Thakur</p>`;
    await resend.emails.send({
        from: 'Portfolio Notifier <onboarding@resend.dev>',
        to: email,
        subject: recruiterSubject,
        html: recruiterBody,
    });

    // B. Email a notification to yourself
    const selfSubject = `New Resume Access Request from ${name} at ${company}`;
    const selfBody = `<p>A new access token was generated and sent to ${name} at ${email}.</p><p>IP: ${ip}</p>`;
    await resend.emails.send({
        from: 'Portfolio Notifier <onboarding@resend.dev>',
        to: NOTIFICATION_EMAIL,
        subject: selfSubject,
        html: selfBody,
    });

    console.log(`Token ${token} generated for ${email}`);
    return response.status(200).json({ success: true });

  } catch (error) {
    console.error('Access Request Error:', error);
    return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
