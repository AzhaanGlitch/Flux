import './App.css';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Box } from '@mui/material'; // <--- FIXED: Imported at the top
import LandingPage from './pages/landing';
import Authentication from './pages/login';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';
import Footer from './components/Footer'; 
import Navbar from './components/Navbar'; 
import Features from './pages/Features'; 
import About from './pages/About';
import Legal from './pages/legal/page';
import ScrollToTop from './components/ScrollToTop'; 

// Main Layout: Navbar + Content + Footer
const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar /> 
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <ScrollToTop />
          
          <Routes>
            {/* GROUP 1: Pages with Navbar & Footer */}
            <Route element={<MainLayout />}>
              <Route path='/' element={<LandingPage />} />
              <Route path='/home' element={<HomeComponent />} />
              <Route path='/history' element={<History />} />
              <Route path='/features' element={<Features />} />
              <Route path='/about' element={<About />} />
              <Route path='/legal' element={<Legal />} />
            </Route>

            {/* GROUP 2: Pages WITHOUT Navbar/Footer */}
            <Route path='/auth' element={<Authentication />} />
            
            {/* Dynamic Route (Must be last) */}
            <Route path='/:url' element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;