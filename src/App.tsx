import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import TeamList from './pages/TeamList';
import CreateTeam from './pages/CreateTeam';
import TeamChat from './pages/TeamChat';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import JoinTeamPage from './pages/JoinTeamPage';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true' ? true : false;
  });

  // Apply dark mode class to document when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <PrivateRoute>
                    <Teams />
                  </PrivateRoute>
                }
              />
              <Route
                path="/team-chat"
                element={
                  <PrivateRoute>
                    <TeamList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-team"
                element={
                  <PrivateRoute>
                    <CreateTeam />
                  </PrivateRoute>
                }
              />
              <Route
                path="/team/:teamId"
                element={
                  <PrivateRoute>
                    <TeamChat />
                  </PrivateRoute>
                }
              />
              {/* Add JoinTeamPage route inside Routes */}
              <Route 
                path="/join-team/:inviteId" 
                element={
                  <PrivateRoute>
                    <JoinTeamPage />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster 
            position="top-right" 
            toastOptions={{
              // Customize toast based on dark mode
              className: 'dark:bg-gray-800 dark:text-white',
              style: {
                background: darkMode ? '#1f2937' : '#fff',
                color: darkMode ? '#fff' : '#000',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}
export default App;