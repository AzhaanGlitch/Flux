import React from 'react';
import { Box, Container, Grid, Typography, Link, Stack, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';

const Tape = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="95" height="80" viewBox="0 0 95 80" fill="none" style={style}>
        <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#a8a5a5ff" fillOpacity="0.8" />
        <path d="M69.6829 39.997C74.772 36.9233 80.2799 35.022 85.4464 32.0415C85.5584 31.9769 85.6703 31.912 85.782 31.8468L83.9519 38.6769C80.2833 32.3886 75.7064 26.4975 72.2275 20.0846C70.0007 15.9783 67.7966 11.8425 65.6183 7.69261L72.9746 9.66373C70.566 10.9281 68.1526 12.1837 65.7375 13.4301C59.1543 16.828 52.5477 20.1634 45.9059 23.4675C39.2779 26.7637 32.6138 30.0293 25.946 33.2683C21.417 35.4683 16.8774 37.6611 12.3408 39.8468C10.3494 40.8065 8.36335 41.7623 6.37228 42.7203C4.88674 43.4348 3.40117 44.1492 1.91563 44.8637C1.70897 44.9628 1.48389 45.0108 1.28779 44.994C1.0916 44.977 0.940536 44.8975 0.866099 44.7681C0.791689 44.6386 0.798739 44.4674 0.882816 44.289C0.966978 44.111 1.12195 43.9408 1.31146 43.8119C2.68692 42.8791 4.06239 41.9462 5.43785 41.0134C6.96571 39.9774 8.49068 38.9427 10.0185 37.9078C10.5758 38.2934 11.1526 38.4968 11.9006 38.3019C12.2823 38.2024 12.7844 37.9628 13.0812 37.66C13.3477 37.388 13.4958 37.092 13.6361 36.8103C13.7828 36.5157 13.922 36.236 14.1819 36.0157C14.6227 35.6416 14.9608 35.1461 15.3159 34.6256C15.4451 34.4362 15.5766 34.2432 15.7162 34.0517C17.1755 33.0653 18.6355 32.0797 20.0958 31.0952C20.7161 30.8123 21.2829 30.546 21.7287 30.2596C22.1286 30.0027 22.4405 29.6732 22.7349 29.3173C22.9611 29.1651 23.1873 29.0128 23.4135 28.8606C24.8734 27.8785 26.3349 26.8977 27.7969 25.9178C29.0653 25.3742 30.3884 24.7936 32.0404 23.9203C32.7524 23.544 33.4842 23.2235 34.1877 22.9153C35.2267 22.4601 36.204 22.0318 36.9653 21.4906C37.4742 21.1289 38.0837 20.8769 38.6916 20.6256C39.507 20.2886 40.3209 19.9521 40.8884 19.3523C41.2452 18.9751 41.5509 18.5904 41.8339 18.234C42.2841 17.6669 42.6773 17.1712 43.1308 16.8909C43.9827 16.3643 44.6366 15.763 45.2128 15.2329C45.9058 14.5954 46.4871 14.0607 47.1661 13.8832C47.2691 13.8563 47.3895 13.83 47.5253 13.8008C48.2409 13.6467 49.3854 13.4004 50.6721 12.4297C51.1302 12.084 51.5022 11.6584 51.8663 11.2413C52.3964 10.634 52.9113 10.0444 53.6546 9.74536C53.7656 9.70072 53.9081 9.70004 54.0379 9.69961C54.203 9.69906 54.3472 9.69852 54.3802 9.60751C54.4771 9.34055 54.6749 8.99305 54.8896 8.61527C55.0473 8.33772 55.2144 8.04348 55.3576 7.75325C57.0866 6.63773 58.8181 5.52571 60.5527 4.41789C61.3473 3.91034 62.1427 3.40353 62.9389 2.89753C63.4939 2.89483 64.0449 2.86301 64.5895 2.76514C65.3015 2.63711 66.1031 2.26098 67.1366 1.7766C67.4515 1.62902 67.788 1.47135 68.1502 1.30751C70.2985 0.211054 72.8781 0.719848 73.9745 2.86814C74.2063 3.38051 74.4505 3.94413 74.6959 4.57024C75.4715 6.54841 76.6121 8.38172 77.451 9.4943C77.6285 9.72958 77.8088 9.965 78.0022 10.2164C78.7359 11.1701 79.6521 12.3598 81.2553 14.6987C82.7718 16.9111 83.9554 18.8538 84.8446 20.3132C85.2985 21.0581 85.6753 21.6776 85.981 22.1424C86.5039 22.9378 87.13 23.9238 87.7583 24.9138C88.7415 26.463 89.7306 28.0221 90.3417 28.8752C90.5592 29.1788 90.7935 29.4941 91.046 29.8348C91.6954 30.711 92.4701 31.7564 93.4198 33.2106C94.9454 36.1998 94.2374 39.789 91.2483 41.3146C91.1356 41.3882 91.0205 41.4628 90.9029 41.5385C89.1849 42.6436 88.0561 43.2181 86.8458 43.7492C86.3539 43.965 85.8291 43.9984 85.2883 44.0321C84.5207 44.08 83.72 44.1298 82.9316 44.7081C82.7476 44.8431 82.5657 45.0123 82.3757 45.1895C82.0265 45.5149 81.649 45.8671 81.1774 46.0805C81.0129 46.1549 80.8442 46.1792 80.6788 46.2029C80.4969 46.229 80.3186 46.2548 80.1526 46.3463C79.5326 46.6883 78.9438 47.0464 78.4208 47.3647C77.7463 47.7753 77.1806 48.1194 76.7972 48.2768C76.1137 48.5573 75.4647 49.0342 74.8076 49.5175C74.3056 49.8867 73.7989 50.2601 73.2678 50.5517C71.7504 51.3848 69.7735 52.7209 67.7901 54.1904C67.0396 54.7464 66.2862 55.0138 65.3207 55.3561C64.7201 55.569 64.0372 55.8105 63.2221 56.1693C62.76 56.3726 62.4565 56.6971 62.1754 56.9973C61.9165 57.2738 61.6763 57.5299 61.3489 57.6526C61.0599 57.7608 60.7846 57.6688 60.5231 57.5815C60.2321 57.4843 59.9583 57.3929 59.702 57.5895C59.5657 57.6942 59.4406 57.8919 59.2918 58.1269C59.233 58.2198 59.1699 58.3187 59.1013 58.4201C59.0842 58.3791 59.0657 58.3442 59.0508 58.3184C58.9457 58.1356 58.6072 58.2028 58.2752 58.2689C58.1427 58.2953 58.0108 58.3219 57.8957 58.3319C57.4719 58.3686 56.8253 58.708 56.3466 58.9941C56.144 59.1151 55.9262 59.1653 55.672 59.224C55.4463 59.2761 55.1919 59.3347 54.894 59.4553C54.7241 59.5242 54.5728 59.541 54.4474 59.5545C54.3567 59.5642 54.2794 59.5724 54.2182 59.5982C54.1652 59.6205 54.1556 59.6959 54.1448 59.7807C54.137 59.8418 54.1285 59.908 54.1028 59.9628C54.0412 60.0939 53.9214 60.1919 53.8153 60.2225C53.7663 60.2366 53.7206 60.2358 53.6753 60.2349C53.6225 60.234 53.5698 60.2326 53.5113 60.2553C53.2429 60.3595 53.0377 60.5575 52.8246 60.7633C52.5903 60.9894 52.3457 61.225 51.9975 61.3556C51.8879 61.3967 51.7593 61.42 51.6348 61.4426C51.5045 61.4661" fill="#222222" fillOpacity="0.8" />
    </svg>
);

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const gmailAddress = "azhaanalisiddiqui15@gmail.com"; 

    return (
        <Box 
            component="footer" 
            sx={{ 
                width: '100%', 
                mt: 'auto',
                py: 8,
                px: 2,
                position: 'relative',
                zIndex: 10,
                backgroundColor: '#000',
                backgroundImage: `
                    radial-gradient(at 50% 100%, rgba(139, 0, 0, 0.5) 0px, transparent 50%),
                    radial-gradient(at 10% 20%, rgba(220, 20, 60, 0.2) 0px, transparent 40%)
                `,
                overflow: 'hidden',
            }}
        >
            <Container 
                maxWidth="lg" 
                sx={{
                    position: 'relative',
                    background: 'rgba(20, 20, 20, 0.4)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    p: { xs: 4, md: 6 },
                    transform: 'rotate(1deg)',
                    transition: 'transform 0.3s ease, background 0.3s ease',
                    '&:hover': {
                        transform: 'rotate(0deg)',
                        background: 'rgba(20, 20, 20, 0.5)',
                    }
                }}
            >
                {/* Decorative Tapes */}
                <Box sx={{ position: 'absolute', top: '-15px', left: '-15px', transform: 'scale(0.75)', zIndex: 50 }}>
                    <Tape />
                </Box>
                <Box sx={{ position: 'absolute', top: '-15px', right: '-15px', transform: 'scale(0.75) rotate(90deg)', zIndex: 50 }}>
                    <Tape />
                </Box>

                <Grid container spacing={4} justifyContent="space-between">
                    <Grid item xs={12} md={4}>
                        <Typography 
                            variant="h5" 
                            component={RouterLink} 
                            to="/" 
                            sx={{ 
                                fontWeight: 800, 
                                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textDecoration: 'none',
                                display: 'inline-block',
                                mb: 2
                            }}
                        >
                            FLUX
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ffffffcc', maxWidth: '300px', lineHeight: 1.6 }}>
                            Lights Dim, Connections Ignite – Your Next Movie Night Starts Here.
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Grid container spacing={4}>
                            {/* Resources Section */}
                            <Grid item xs={6} sm={4}>
                                <Typography variant="subtitle2" sx={{ color: '#DC143C', fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                                    Resources
                                </Typography>
                                <Stack spacing={1}>
                                    <Link component={RouterLink} to="/features" sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        Features
                                    </Link>
                                    <Link component="a" href={`mailto:${gmailAddress}`} sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        Help Center
                                    </Link>
                                </Stack>
                            </Grid>

                            {/* Company Section */}
                            <Grid item xs={6} sm={4}>
                                <Typography variant="subtitle2" sx={{ color: '#DC143C', fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                                    Company
                                </Typography>
                                <Stack spacing={1}>
                                    <Link component={RouterLink} to="/about" sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        About Us
                                    </Link>
                                    <Link component="a" href={`mailto:${gmailAddress}`} sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        Contact
                                    </Link>
                                </Stack>
                            </Grid>

                            {/* Legal Section */}
                            <Grid item xs={6} sm={4}>
                                <Typography variant="subtitle2" sx={{ color: '#DC143C', fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                                    Legal
                                </Typography>
                                <Stack spacing={1}>
                                    <Link component={RouterLink} to="/legal?section=privacy" sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        Privacy Policy
                                    </Link>
                                    <Link component={RouterLink} to="/legal?section=terms" sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        Terms of Service
                                    </Link>
                                    <Link component={RouterLink} to="/legal?section=cookie" sx={{ color: '#ffffffcc', textDecoration: 'none', '&:hover': { color: 'red' } }}>
                                        Cookie Policy
                                    </Link>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                        © {currentYear} Flux Inc. All rights reserved.
                    </Typography>
                    
                    <Stack direction="row" spacing={2}>
                        <IconButton 
                            size="small" 
                            component="a" 
                            href="https://www.linkedin.com/in/azhaanalisiddiqui/" 
                            target="_blank" 
                            sx={{ color: '#9ca3af', '&:hover': { color: '#DC143C' } }}
                        >
                            <LinkedInIcon />
                        </IconButton>
                        <IconButton 
                            component="a" 
                            href="https://github.com/AzhaanGlitch" 
                            target="_blank" 
                            size="small" 
                            sx={{ color: '#9ca3af', '&:hover': { color: '#DC143C' } }}
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}