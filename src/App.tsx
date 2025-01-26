import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import TeamList from './pages/TeamList';
import CreateTeam from './pages/CreateTeam';
import TeamChat from './pages/TeamChat';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;