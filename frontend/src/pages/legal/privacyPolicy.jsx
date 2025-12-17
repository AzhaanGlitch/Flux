import React from 'react';
import { Typography } from '@mui/material';

export default function PrivacyPolicy() {
    return (
        <>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
                Privacy Policy
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
                    At FLUX, we are committed to protecting your privacy and ensuring the security of your personal information. FLUX is a video conferencing platform designed to facilitate seamless connections through features like synchronized media playback, HD video calls, live chat, and screen sharing. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (fluxapp.com or any affiliated domains), use our mobile applications (available on iOS and Android), or engage with our services (collectively, the "Services").
                </p>
                <p>
                    By accessing or using the Services, you consent to the practices described in this Privacy Policy. If you do not agree with our practices, please do not use the Services. This Policy applies to all users, including visitors, registered users, and participants in video meetings.
                </p>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Policy on our website and updating the "Effective Date" above. Significant changes will also be communicated via email (if you have provided an email address) or in-app notifications. Your continued use of the Services after such changes constitutes your acceptance of the updated Policy.
                </p>

                <h3>1. Information We Collect</h3>
                <p>
                    We collect information to provide, improve, and secure our Services. The types of information we collect fall into three main categories: information you provide directly, information collected automatically, and information from third parties.
                </p>

                <h4>1.1 Information You Provide Directly</h4>
                <ul>
                    <li><strong>Account Registration and Profile Information</strong>: When you create an account or log in (via email/password or third-party services like Google), we collect your full name, email address, username, and password. For Google login, we receive your Google account details (e.g., name, email) as permitted by Google's OAuth policies.</li>
                    <li><strong>Meeting Participation Data</strong>: When you join or host a meeting, we collect meeting codes (unique identifiers for sessions), participant usernames (if provided), and timestamps for start/end times.</li>
                    <li><strong>User-Generated Content</strong>: In live chat features, we collect messages, emojis, reactions, and timestamps. For screen sharing or media playback (e.g., watch parties), we do not store the shared content but may log metadata like session duration.</li>
                    <li><strong>History and Preferences</strong>: We store your meeting history (e.g., past meeting codes and dates) to enable features like "Join Again." You can view and delete this via the History page.</li>
                    <li><strong>Support and Feedback</strong>: If you contact us via email, in-app support, or forms, we collect your messages, attachments, and contact details.</li>
                </ul>

                <h4>1.2 Information Collected Automatically</h4>
                <p>
                    We use cookies, server logs, and analytics tools to collect usage data. This helps us understand how you interact with the Services.
                </p>
                <ul>
                    <li><strong>Usage Data</strong>: We log your interactions, such as pages visited, features used (e.g., video calls, screen shares), session duration, and error reports.</li>
                    <li><strong>Device and Technical Information</strong>: We collect device type, operating system (e.g., iOS, Android, Windows), browser type/version, IP address (for approximate location and fraud prevention), unique device identifiers, and network details (e.g., connection speed for optimizing video quality).</li>
                    <li><strong>Video and Audio Metadata</strong>: During calls, we collect non-content metadata like call duration, number of participants, and quality metrics (e.g., latency, resolution). We do not record or store video/audio streams, as connections are peer-to-peer via WebRTC.</li>
                    <li><strong>Location Data</strong>: We may infer approximate location from your IP address. Precise geolocation is only collected if you enable it (e.g., for features like location-based participant sorting) and with your explicit consent.</li>
                </ul>

                <h4>1.3 Information from Third Parties</h4>
                <ul>
                    <li><strong>Social Logins</strong>: If you log in via Google, we receive basic profile information (name, email, profile picture) from their APIs.</li>
                    <li><strong>Analytics Partners</strong>: We use tools like Google Analytics to aggregate anonymized usage data.</li>
                    <li><strong>Payment Processors</strong>: If we introduce premium features (e.g., SuperGrok integration), we collect billing details via third-party processors like Stripe, but we do not store full payment information.</li>
                </ul>
                <p>
                    We do not collect sensitive personal information (e.g., health, financial, or biometric data) unless explicitly required for a feature and with your consent.
                </p>

                <h3>2. How We Use Your Information</h3>
                <p>
                    We use the collected information to deliver and enhance the Services while complying with legal obligations.
                </p>
                <ul>
                    <li><strong>Providing the Services</strong>: To authenticate users, generate meeting codes, facilitate peer-to-peer connections (via Socket.io and WebRTC), sync media playback, and store meeting history.</li>
                    <li><strong>Improving Functionality</strong>: To analyze usage patterns, debug issues (e.g., low-latency video), and develop new features like cross-platform support.</li>
                    <li><strong>Communication</strong>: To send transactional emails (e.g., meeting reminders, account verification) and promotional updates (with opt-out options).</li>
                    <li><strong>Security and Fraud Prevention</strong>: To detect unauthorized access, enforce terms, and protect against abuse (e.g., monitoring for spam in chats).</li>
                    <li><strong>Analytics and Research</strong>: To generate aggregated insights (e.g., average session length) without identifying individuals.</li>
                    <li><strong>Legal Compliance</strong>: To respond to lawful requests, enforce our Terms of Service, or protect rights/safety.</li>
                </ul>
                <p>
                    We retain information only as long as necessary: account data for the duration of your account plus 30 days post-deletion; meeting history until you delete it; logs for 90 days.
                </p>

                <h3>3. Sharing Your Information</h3>
                <p>
                    We do not sell, rent, or trade your personal information. We share it only in limited circumstances:
                </p>
                <ul>
                    <li><strong>Service Providers</strong>: With trusted vendors (e.g., AWS for hosting, Google for analytics) under strict confidentiality agreements. These providers are bound by data protection laws like GDPR and CCPA.</li>
                    <li><strong>Other Users</strong>: In meetings, usernames and participant counts are visible to others. Video/audio streams are end-to-end encrypted and not accessible to us or third parties.</li>
                    <li><strong>Business Transfers</strong>: In the event of a merger, acquisition, or sale of assets, your information may be transferred, with notice where required.</li>
                    <li><strong>Legal Requirements</strong>: If compelled by law, subpoena, or government request, we may disclose information to authorities. We notify users unless prohibited.</li>
                    <li><strong>Aggregated Data</strong>: Anonymized, non-identifiable data may be shared for research or marketing (e.g., "X% of users prefer HD video").</li>
                </ul>
                <p>
                    For international users, data may be transferred to the US (where we operate). We ensure adequate safeguards via Standard Contractual Clauses.
                </p>

                <h3>4. Data Security</h3>
                <p>
                    We prioritize your data's security using industry-standard measures:
                </p>
                <ul>
                    <li><strong>Encryption</strong>: All data in transit (e.g., video streams via WebRTC DTLS/SRTP) and at rest (e.g., AES-256 for stored history) is encrypted.</li>
                    <li><strong>Access Controls</strong>: Role-based access for our team; multi-factor authentication for accounts.</li>
                    <li><strong>Regular Audits</strong>: Vulnerability scans, penetration testing, and compliance with SOC 2 standards.</li>
                    <li><strong>Incident Response</strong>: In case of a breach, we notify affected users within 72 hours (per GDPR) and provide remediation steps.</li>
                </ul>
                <p>
                    No system is impenetrable; we cannot guarantee absolute security.
                </p>

                <h3>5. Your Privacy Rights and Choices</h3>
                <p>
                    Depending on your location, you may have rights under laws like GDPR (EU/UK), CCPA (California), or LGPD (Brazil):
                </p>
                <ul>
                    <li><strong>Access</strong>: Request a copy of your personal data.</li>
                    <li><strong>Correction</strong>: Update inaccurate information via account settings.</li>
                    <li><strong>Deletion</strong>: Close your account or delete specific data (e.g., meeting history). Note: We retain limited data for legal reasons.</li>
                    <li><strong>Objection/Opt-Out</strong>: Withdraw consent, opt out of marketing, or restrict processing.</li>
                    <li><strong>Portability</strong>: Receive your data in a machine-readable format.</li>
                    <li><strong>Automated Decisions</strong>: We do not make solely automated decisions affecting you.</li>
                </ul>
                <p>
                    To exercise rights, email privacy@fluxapp.com. We respond within 30 days (extendable for complex requests). For CCPA, we do not "sell" data as defined.
                </p>
                <p>
                    You can manage cookies via browser settings and opt out of analytics by disabling JavaScript or using tools like Google Analytics Opt-Out.
                </p>

                <h3>6. Children's Privacy</h3>
                <p>
                    Our Services are not directed to children under 13 (US) or 16 (EU, depending on jurisdiction). We do not knowingly collect data from children. If we learn of such collection, we delete it promptly. Parents/guardians can contact us at privacy@fluxapp.com.
                </p>

                <h3>7. International Users and Data Transfers</h3>
                <p>
                    FLUX is based in the United States. If you access Services from outside the US, your data may be transferred to and processed in the US. We comply with applicable transfer mechanisms (e.g., EU-US Data Privacy Framework).
                </p>

                <h3>8. Third-Party Links and Services</h3>
                <p>
                    Our Services may link to third-party sites (e.g., Google for login). We are not responsible for their privacy practices. Review their policies before use.
                </p>

                <h3>9. Contact Us</h3>
                <p>
                    For questions, complaints, or data requests, contact our Data Protection Officer:
                </p>
                <ul>
                    <li><strong>Email</strong>: azhaanalisiddiqui15@gmail.com</li>
                </ul>
                <p>
                    Thank you for trusting FLUX with your connections. We value your privacy as much as your shared moments.
                </p>
            </Typography>
        </>
    );
}