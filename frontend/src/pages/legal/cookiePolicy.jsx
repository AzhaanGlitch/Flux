import React from 'react';
import { Typography } from '@mui/material';

export default function CookiePolicy() {
    return (
        <>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
                Cookie Policy
            </Typography>
            <br></br>
            
            <Typography component="div" sx={{ 
                color: '#d1d5db', 
                lineHeight: 1.8,
                fontSize: '1.05rem',
                '& h3': { color: '#fff', mt: 4, mb: 2, fontSize: '1.5rem', fontWeight: 600 },
                '& h4': { color: '#fff', mt: 3, mb: 1.5, fontSize: '1.3rem', fontWeight: 500 },
                '& p': { mb: 2 },
                '& ul': { pl: 4, mb: 2 },
                '& li': { mb: 0.5 },
                '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
                '& th, & td': { border: '1px solid rgba(255,255,255,0.1)', p: 1, textAlign: 'left' },
                '& th': { backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 600 }
            }}>
                <p>
                    At FLUX, we use cookies and similar tracking technologies to enhance your experience on our website (fluxapp.com or any affiliated domains), mobile applications (available on iOS and Android), and services (collectively, the "Services"). This Cookie Policy explains what cookies are, how we use them, the types we employ, and your choices for managing them. FLUX is a video conferencing platform featuring synchronized media playback, HD video calls, live chat, and screen sharing.
                </p>
                <p>
                    By accessing or using the Services, you consent to the use of cookies as described in this Policy, unless you have disabled them. This Policy is incorporated into our Privacy Policy and Terms and Conditions. We may update this Policy periodically; changes will be posted here with an updated "Effective Date." Continued use of the Services after changes constitutes acceptance.
                </p>

                <h3>1. What Are Cookies?</h3>
                <p>
                    Cookies are small text files or data packets stored on your device (e.g., computer, tablet, or smartphone) by your web browser or mobile app when you visit a website or use an application. They allow websites and apps to recognize your device, remember preferences, and track interactions across sessions. Cookies can be "first-party" (set by the site you visit) or "third-party" (set by external services like analytics providers).
                </p>
                <p>
                    Similar technologies include web beacons (tiny images that track opens/views), local storage (browser-based data storage), and pixels/tags (for measuring engagement). In our mobile apps, we may use similar device identifiers for functionality.
                </p>

                <h3>2. How We Use Cookies</h3>
                <p>
                    We use cookies to provide, improve, and secure the Services, as well as for analytics and personalization. Specifically:
                </p>
                <ul>
                    <li><strong>Essential Functions</strong>: To enable core features like session management, authentication, generating meeting codes, and maintaining peer-to-peer connections (e.g., via Socket.io and WebRTC).</li>
                    <li><strong>Analytics</strong>: To understand usage patterns, such as popular features (e.g., video calls vs. watch parties), session duration, and error rates, helping us optimize low-latency performance.</li>
                    <li><strong>Preferences and Personalization</strong>: To store user settings, like video quality preferences or dark mode, and recall meeting history for "Join Again" functionality.</li>
                    <li><strong>Advertising and Marketing</strong>: To deliver relevant ads (if enabled) based on your interactions, such as interest in cross-platform features, and measure ad effectiveness without selling personal data.</li>
                    <li><strong>Security</strong>: To detect fraudulent activity, enforce rate limits on meeting joins, and protect against abuse in chat or screen sharing.</li>
                </ul>
                <p>
                    We do not use cookies to track sensitive information or for purposes beyond those outlined. Third-party cookies may be placed by partners like Google Analytics for aggregated insights.
                </p>

                <h3>3. Types of Cookies We Use</h3>
                <p>
                    We use both session cookies (temporary, deleted when you close your browser) and persistent cookies (stored longer for ongoing recognition). Below is a summary of cookie types, their purposes, durations, and examples:
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>Cookie Type</th>
                            <th>Purpose</th>
                            <th>Duration</th>
                            <th>Examples</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Essential</strong></td>
                            <td>Core functions (e.g., session management, meeting codes, authentication)</td>
                            <td>Session (until browser closes)</td>
                            <td><code>session_id</code>, <code>auth_token</code>, <code>meeting_code_temp</code></td>
                        </tr>
                        <tr>
                            <td><strong>Performance/Analytics</strong></td>
                            <td>Analytics (e.g., page load times, feature usage, traffic sources)</td>
                            <td>Up to 2 years</td>
                            <td>Google Analytics (<code>_ga</code>, <code>_gid</code>)</td>
                        </tr>
                        <tr>
                            <td><strong>Functional</strong></td>
                            <td>Preferences (e.g., video quality settings, theme preferences)</td>
                            <td>Up to 1 year</td>
                            <td><code>user_prefs</code>, <code>history_view</code></td>
                        </tr>
                        <tr>
                            <td><strong>Advertising</strong></td>
                            <td>Targeted ads (if enabled, e.g., based on meeting features viewed)</td>
                            <td>Up to 13 months</td>
                            <td>Google Ads (<code>_gads</code>, <code>_gac_gb</code>)</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    For a full list, including third-party cookies, refer to our cookie scanner tool (accessible via the footer on our site) or contact privacy@fluxapp.com.
                </p>

                <h3>4. Your Choices Regarding Cookies</h3>
                <p>
                    You have control over cookies and tracking. Here's how to manage them:
                </p>
                <ul>
                    <li><strong>Browser Settings</strong>: Most browsers allow you to accept, reject, or delete cookies. For instructions:
                        <ul style={{ paddingLeft: '2rem' }}>
                            <li>Chrome: Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                            <li>Firefox: Options &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                            <li>Safari: Preferences &gt; Privacy &gt; Manage Website Data</li>
                            <li>Edge: Settings &gt; Cookies and site permissions &gt; Manage and delete cookies</li>
                        </ul>
                    </li>
                    <li><strong>Do Not Track (DNT)</strong>: We honor DNT signals where possible, limiting non-essential tracking.</li>
                    <li><strong>Opt-Out Tools</strong>: Use the Network Advertising Initiative (NAI) opt-out or Digital Advertising Alliance (DAA) for third-party ads. For Google Analytics, visit tools.google.com/dlpage/gaoptout.</li>
                    <li><strong>Cookie Banner</strong>: On first visit, you'll see a consent banner to accept or customize cookies. You can revisit preferences in your account settings.</li>
                    <li><strong>Mobile Apps</strong>: On iOS/Android, manage via device settings &gt; Privacy &gt; Tracking or Advertising.</li>
                </ul>
                <p>
                    Note: Disabling essential cookies may impair Services (e.g., inability to join meetings). We recommend keeping them enabled.
                </p>

                <h3>5. Third-Party Cookies and Links</h3>
                <p>
                    Third parties (e.g., Google for login/analytics, Stripe for payments if premium features are added) may set cookies when you interact with their services via our platform. We do not control these; review their policies for details.
                </p>
                <p>
                    Links to external sites (e.g., support resources) are not covered by this Policy. We are not responsible for their cookie practices.
                </p>

                <h3>6. Data Retention and Security</h3>
                <p>
                    Cookies are retained per their duration (see table). We secure cookie data using encryption (e.g., HTTPS) and comply with standards like GDPR/CCPA. For breaches affecting cookies, see our Privacy Policy.
                </p>

                <h3>7. Contact Us</h3>
                <p>
                    For questions about this Cookie Policy or to request cookie data/deletion, contact:
                </p>
                <ul>
                    <li><strong>Email</strong>: azhaanalisiddiqui15@gmail.com</li>
                </ul>
            </Typography>
        </>
    );
}