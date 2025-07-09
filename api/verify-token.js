// This function verifies a single-use token from the Vercel KV store
// and returns the entire resume HTML content if the token is valid.
// File path: /api/verify-token.js

import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // --- Standard CORS and Method Check ---
  const allowedOrigins = [
    'https://rahulkumareconomist.github.io',
    'https://rahulkumareconomist-github-io.vercel.app' 
    // Add localhost for testing if needed
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
    return response.status(405).json({ success: false, error: 'Only POST requests are allowed' });
  }

  try {
    const { token } = request.body;
    if (!token) {
      return response.status(400).json({ success: false, error: 'Token is required.' });
    }

    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const storedToken = await kv.get(token);

    if (storedToken) {
      // Success! Token is valid. Delete it to make it single-use.
      await kv.del(token);
      
      // --- SECURE RESUME CONTENT ---
      // The entire resume HTML is stored securely here on the server.
      // The confidential values are injected from your Vercel Environment Variables.
      const sovereignPortfolioValue = process.env.SOVEREIGN_PORTFOLIO_VALUE || '[Value Unavailable]';
      const lombardPortfolioValue = process.env.LOMBARD_PORTFOLIO_VALUE || '[Value Unavailable]';

      const resumeHtml = `
        <div class="paper-container" style="font-size: 0.9rem; line-height: 1.5;">
            <header class="text-center mb-8 pb-4 border-b">
                <h1 class="text-2xl font-bold text-gray-800">RAHUL KUMAR</h1>
                <div class="header-contact text-gray-600 mt-2" style="font-size: 0.9rem;">
                    <a href="mailto:rahulkumar_rk@live.in" class="text-blue-600 hover:underline">rahulkumar_rk@live.in</a> |
                    <span>+91 9740871055</span> |
                    <a href="https://www.linkedin.com/in/rahulkumarrk" target="_blank" class="text-blue-600 hover:underline">linkedin.com/in/rahulkumarrk</a> |
                    <a href="https://rahulkumareconomist.github.io/" target="_blank" class="text-blue-600 hover:underline">Portfolio: rahulkumareconomist.github.io</a>
                </div>
            </header>
            <main>
                <section class="mb-6">
                    <h2 class="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-3 text-gray-700">Profile Summary</h2>
                    <p class="text-justify">
                        Senior Quantitative Researcher with over 12 years of experience in designing, backtesting, and validating systematic, alpha-generating investment strategies across multiple asset classes. Proven expertise in factor modeling, portfolio optimization, and machine learning. Combines a deep background in buy-side strategy development with institutional-grade risk management and model governance experience forged at a top-tier global investment bank.
                    </p>
                </section>
                <section class="mb-6">
                    <h2 class="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-3 text-gray-700">Core Competencies</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8" style="font-size: 0.9rem;">
                        <div>
                            <p><strong class="font-semibold">Quantitative Research & Strategy:</strong> Alpha Signal Research, Systematic Strategy Development, Factor Modeling, Statistical Arbitrage, Macro-based Strategies.</p>
                            <p><strong class="font-semibold">Backtesting & Validation:</strong> Robust Historical & Out-of-Sample Backtesting, Performance Attribution, Risk Analytics (VaR).</p>
                        </div>
                        <div>
                            <p><strong class="font-semibold">Technology & Data:</strong> Python (Pandas, NumPy, Scikit-learn), R (Expert), SQL, C++, Financial Data APIs (Bloomberg, Haver).</p>
                            <p><strong class="font-semibold">Machine Learning:</strong> Time Series Analysis (VAR, GARCH), Regression, PCA, NLP for Sentiment Analysis.</p>
                        </div>
                    </div>
                </section>
                <section class="mb-6">
                    <h2 class="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-3 text-gray-700">Research and Professional Experience</h2>
                    <div class="mb-5">
                        <div class="flex justify-between items-baseline flex-wrap pb-1 border-b border-gray-200">
                            <h3 class="text-base font-semibold text-gray-800">Quantitative Analyst - Associate Director, UBS</h3>
                            <p class="text-sm text-gray-600 italic">March 2021 - Present</p>
                        </div>
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                            <li class="text-justify">Led a team in the <strong>quantitative analysis and research</strong> of complex credit and valuation models to identify weaknesses, assess performance, and ensure soundness across the firm's portfolios.</li>
                            <li class="text-justify">Conducted in-depth research on portfolio risk factors to architect a VaR-based model, enhancing the robustness of investment strategies for discretionary mandates.</li>
                            <li class="text-justify">Managed a <span class="font-semibold">${sovereignPortfolioValue}</span> Sovereign portfolio, conducting periodic reviews and re-estimating/recalibrating parameters using multivariate regression and tail loss modeling.</li>
                            <li class="text-justify">Conducted Stress Testing & Benchmarking Analysis for Swiss National Bank regulatory submissions, analyzing stress loss evolution.</li>
                        </ul>
                    </div>
                    <div class="mb-5">
                        <div class="flex justify-between items-baseline flex-wrap pb-1 border-b border-gray-200">
                            <h3 class="text-base font-semibold text-gray-800">Senior Research Analyst, CRISIL Ltd.</h3>
                            <p class="text-sm text-gray-600 italic">January 2017 - March 2019</p>
                        </div>
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                             <li class="text-justify"><strong>Researched and developed novel alpha-generating signals</strong> for systematic multi-asset investment strategies, primarily in R.</li>
                             <li class="text-justify"><strong>Designed, backtested, and validated systematic factor-based strategies</strong>, including Investment Clock (macro regime), Credit Impulse, and Sector Rotation models, to drive portfolio returns.</li>
                             <li class="text-justify">Developed "Nowcasting GDP" model integrating Principal Component Analysis, Vector Autoregression, and Kalman Filter Smoother.</li>
                             <li class="text-justify">Designed and developed an NLP and text mining algorithm for sentiment-based stock price prediction from Fortune 500 US company reports.</li>
                        </ul>
                    </div>
                </section>
                <section class="mb-6">
                    <h2 class="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-3 text-gray-700">Working Papers & Projects</h2>
                    <div class="mb-4">
                        <h3 class="text-base font-semibold">QuantumFeed: A High-Fidelity, Agent-Based Simulator for Analyzing Market Microstructure (Working Paper, 2025)</h3>
                        <p class="mt-1 text-justify">Introduced a novel, open-source simulator for high-frequency trading research, combining a high-performance C++ matching engine with a flexible Python agent framework. The work details its distributed architecture and validation against stylized facts of financial markets, culminating in a successful replication of the 2010 Flash Crash. <a href="https://rahulkumareconomist.github.io/" target="_blank" class="text-blue-600 font-semibold hover:underline">View Project &rarr;</a></p>
                    </div>
                </section>
                <section class="mb-6">
                    <h2 class="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-3 text-gray-700">Education & Publication</h2>
                    <div class="mb-4">
                        <h3 class="text-base font-semibold">Ph.D. in Economics (undergoing), BITS, Pilani - Hyderabad</h3>
                        <p class="mt-1 text-justify">Research Focus: Global Macroeconomy, International Finance, Global Capital & Trade Flow, Central Banking, Econometrics.</p>
                    </div>
                    <div class="mb-4">
                         <h3 class="text-base font-semibold">MA Applied Economics, Christ University, Bangalore</h3>
                    </div>
                     <div class="publication-item">
                        <h3 class="text-base font-semibold">International Publication: Kumar, Rahul (2014). "India's Challenge on Managing the External Sector, with the Sterilization of Capital Flows," Transnational Corporations Review, 6(2):147-170.</h3>
                    </div>
                </section>
            </main>
            <footer class="flex justify-between items-end mt-10 pt-4 border-t-2 border-gray-200 text-sm text-gray-600">
                 <p>Mumbai, Maharashtra</p>
                 <p>Rahul Kumar</p>
            </footer>
        </div>
      `;

      return response.status(200).json({ success: true, htmlContent: resumeHtml });

    } else {
      // Token is invalid or has already been used/expired.
      return response.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }

  } catch (error) {
    console.error('Verification Error:', error);
    return response.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
}
