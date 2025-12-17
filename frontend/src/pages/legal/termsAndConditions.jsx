import React from 'react';
import { Typography } from '@mui/material';

export default function TermsAndConditions() {
    return (
        <>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
                Terms and Conditions
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
                <h3>Effective Date: December 17, 2025</h3>
                <p>
                    These Terms and Conditions ("Terms") govern your access to and use of the FLUX website, mobile applications, and services (collectively, the "Services") provided by FLUX Inc. FLUX is a video conferencing platform that enables users to connect through features such as HD video calls, synchronized media playback, live chat, screen sharing, and watch parties.
                </p>
                <p>
                    By accessing or using the Services, you agree to be bound by these Terms, our Privacy Policy (incorporated herein by reference), and any applicable end-user license agreements. If you do not agree with any part of these Terms, you must not use the Services. These Terms apply to all users, including visitors, registered users, and participants in video meetings.
                </p>
                <p>
                    You must be at least 13 years old (or the minimum age required in your jurisdiction) to use the Services. By using the Services, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
                </p>
                <p>
                    We may update these Terms from time to time. We will notify you of changes by posting the revised Terms on our website and updating the "Effective Date" above. Significant changes will also be communicated via email (if you have provided an email address) or in-app notifications. Your continued use of the Services after such changes constitutes your acceptance of the updated Terms.
                </p>

                <h3>1. Description of Services</h3>
                <p>
                    The Services allow users to create and join video meetings using unique meeting codes, facilitate real-time interactions via video, audio, chat, and screen sharing, and enable synchronized media playback for shared experiences. Features include low-latency connections via WebRTC, cross-platform compatibility (web, iOS, Android), and meeting history management.
                </p>
                <p>
                    FLUX provides the Services on an "as is" and "as available" basis. We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time without notice.
                </p>

                <h3>2. User Accounts and Responsibilities</h3>
                <h4>2.1 Account Creation</h4>
                <p>
                    To access certain features, you must create an account by providing accurate information, including your full name, email address, username, and password. You may also register using third-party services like Google, which may provide us with additional profile information.
                </p>
                <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account. You agree to notify us immediately at support@fluxapp.com of any unauthorized use or security breach.
                </p>

                <h4>2.2 Account Termination</h4>
                <p>
                    You may close your account at any time via the account settings. We may suspend or terminate your account for violations of these Terms, including but not limited to fraudulent activity, abuse, or non-compliance with applicable laws.
                </p>

                <h3>3. User Conduct and Prohibited Activities</h3>
                <p>
                    You agree to use the Services only for lawful purposes and in a manner that does not infringe the rights of others. You are prohibited from:
                </p>
                <ul>
                    <li>Violating any applicable local, national, or international law or regulation.</li>
                    <li>Transmitting spam, unsolicited advertisements, or promotional materials without consent.</li>
                    <li>Impersonating any person or entity, or misrepresenting your affiliation with FLUX or others.</li>
                    <li>Uploading, transmitting, or distributing viruses, malware, or harmful code.</li>
                    <li>Engaging in harassment, hate speech, threats, or any form of abusive behavior.</li>
                    <li>Interfering with the Services, including hacking, reverse engineering, or disrupting servers.</li>
                    <li>Sharing illegal, obscene, or copyrighted content without authorization.</li>
                    <li>Using automated tools (e.g., bots) to access or scrape data from the Services.</li>
                </ul>
                <p>
                    We reserve the right to monitor usage for compliance and may remove content or terminate access for violations. You are responsible for all content you upload or share during meetings.
                </p>

                <h3>4. Intellectual Property Rights</h3>
                <p>
                    The Services, including all text, graphics, logos, icons, software, and underlying technology (e.g., Socket.io, WebRTC implementations), are owned by FLUX or our licensors and protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                    You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Services for personal, non-commercial purposes. You may not copy, modify, distribute, or create derivative works from the Services without our prior written consent.
                </p>
                <p>
                    FLUX trademarks, service marks, and logos may not be used without express permission.
                </p>

                <h3>5. Content Ownership and Licenses</h3>
                <h4>5.1 Your Content</h4>
                <p>
                    You retain ownership of any content you upload, share, or generate through the Services (e.g., chat messages, screen shares, media files). By using the Services, you grant FLUX a worldwide, royalty-free, non-exclusive, sublicensable license to host, store, display, and transmit your content as necessary to provide the Services.
                </p>

                <h4>5.2 Our Content</h4>
                <p>
                    All content provided by FLUX, including but not limited to meeting interfaces, icons, and animations, remains our property. You may not remove or alter any proprietary notices.
                </p>

                <h3>6. Payments and Subscriptions</h3>
                <p>
                    The core Services are provided free of charge. Premium features (e.g., extended storage for meeting history, advanced analytics) may be offered via subscription. All payments are processed through third-party providers (e.g., Stripe), and you agree to their terms. We do not store full payment details.
                </p>
                <p>
                    Subscriptions may auto-renew unless canceled. Refunds are at our discretion, subject to applicable laws.
                </p>

                <h3>7. Termination</h3>
                <p>
                    These Terms are effective until terminated. You may terminate by closing your account and ceasing use. We may terminate your access immediately for breach of these Terms, with or without notice.
                </p>
                <p>
                    Upon termination, your right to use the Services ends, and you must delete any cached data. Provisions that survive termination include ownership, liability, indemnification, and governing law.
                </p>

                <h3>8. Disclaimers and Limitation of Liability</h3>
                <p>
                    The Services are provided "as is" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee uninterrupted or error-free operation.
                </p>
                <p>
                    In no event shall FLUX be liable for indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, or goodwill, arising from your use of the Services, even if advised of the possibility.
                </p>
                <p>
                    Our total liability shall not exceed $100 or the amount paid by you in the past 12 months, whichever is greater.
                </p>

                <h3>9. Indemnification</h3>
                <p>
                    You agree to indemnify, defend, and hold harmless FLUX, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Services, violation of these Terms, or infringement of third-party rights.
                </p>

                <h3>10. Governing Law and Dispute Resolution</h3>
                <p>
                    These Terms are governed by the laws of the State of California, USA, without regard to conflict of laws principles. Any disputes shall be resolved exclusively in the state or federal courts located in San Francisco County, California.
                </p>
                <p>
                    You agree to submit to the personal jurisdiction of such courts. For users outside the US, you consent to the use of electronic communications and agree that all disputes will be resolved in English.
                </p>

                <h3>11. Changes to Terms</h3>
                <p>
                    We may revise these Terms at our discretion. Continued use after changes implies acceptance. Check this page periodically for updates.
                </p>

                <h3>12. Contact Us</h3>
                <p>
                    For questions about these Terms, please contact:
                </p>
                <ul>
                    <li><strong>Email</strong>: azhaanalisiddiqui15@gmail.com</li>
                </ul>
                <p>
                    Thank you for using FLUX. We look forward to connecting you with meaningful shared experiences.
                </p>
            </Typography>
        </>
    );
}