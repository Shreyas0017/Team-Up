import { Link } from 'react-router-dom';
import { Users, UserCircle, LogIn, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from './ui/Button';
import RequestNotifications from './RequestNotifications';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">TeamUp</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/teams">
                  <Button variant="ghost">Find Teams</Button>
                </Link>
                <RequestNotifications />
                <Link to="/profile">
                  <Button variant="ghost">
                    <UserCircle className="mr-2 h-5 w-5" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => auth.signOut()}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}