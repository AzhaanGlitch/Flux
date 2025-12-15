import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert } from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: '#667eea',
        },
        secondary: {
            main: '#764ba2',
        },
    },
});

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        setError("");
        try {
            if (formState === 0) {
                if (!username || !password) {
                    setError("Please fill in all fields");
                    return;
                }
                await handleLogin(username, password);
            }
            if (formState === 1) {
                if (!name || !username || !password) {
                    setError("Please fill in all fields");
                    return;
                }
                let result = await handleRegister(name, username, password);
                setUsername("");
                setName("");
                setPassword("");
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
            }
        } catch (err) {
            let message = err?.response?.data?.message || "Something went wrong";
            setError(message);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: 'white',
                        padding: '2rem',
                    }}
                >
                    <VideoCallIcon sx={{ fontSize: 100, mb: 3 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
                        Welcome to Flux
                    </Typography>
                    <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.9 }}>
                        Connect with anyone, anywhere with high-quality video calls
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={0} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                            <VideoCallIcon />
                        </Avatar>

                        <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 3, fontWeight: 600 }}>
                            {formState === 0 ? 'Sign In' : 'Create Account'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <Button 
                                variant={formState === 0 ? "contained" : "outlined"} 
                                onClick={() => setFormState(0)}
                                sx={{ 
                                    textTransform: 'none',
                                    minWidth: '120px',
                                    fontWeight: 600
                                }}
                            >
                                Sign In
                            </Button>
                            <Button 
                                variant={formState === 1 ? "contained" : "outlined"} 
                                onClick={() => setFormState(1)}
                                sx={{ 
                                    textTransform: 'none',
                                    minWidth: '120px',
                                    fontWeight: 600
                                }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Full Name"
                                    value={name}
                                    autoFocus={formState === 1}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Username"
                                value={username}
                                autoFocus={formState === 0}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Password"
                                value={password}
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ 
                                    mt: 3, 
                                    mb: 2,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? "Sign In" : "Create Account"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}