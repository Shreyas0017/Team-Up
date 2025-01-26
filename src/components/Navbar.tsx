import { Link } from 'react-router-dom';
import { Users, UserCircle, LogIn, LogOut, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from './ui/Button';
import RequestNotifications from './RequestNotifications';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-lg"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-3 group"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Users className="h-7 w-7 text-blue-600 group-hover:text-blue-800 transition-colors" />
            </motion.div>
            <span className="text-lg md:text-2xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
              TeamUp
            </span>
          </Link>

          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="flex items-center space-x-2 md:space-x-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/teams">
                    <Button variant="ghost" className="group">
                      <Sparkles className="mr-2 h-5 w-5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                      <span className="hidden md:inline">Find Teams</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/team-chat">
                    <Button variant="ghost" className="group">
                      <MessageCircle className="mr-2 h-5 w-5 text-green-500 group-hover:text-green-700 transition-colors" />
                      <span className="hidden md:inline">Chats</span>
                    </Button>
                  </Link>
                </motion.div>

                <RequestNotifications />

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/profile">
                    <Button variant="ghost" className="group">
                      <UserCircle className="mr-2 h-5 w-5 text-purple-500 group-hover:text-purple-700 transition-colors" />
                      <span className="hidden md:inline">Profile</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => auth.signOut()}
                    className="group"
                  >
                    <LogOut className="mr-2 h-5 w-5 group-hover:rotate-45 transition-transform" />
                    <span className="hidden md:inline">Sign Out</span>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                    <LogIn className="mr-2 h-5 w-5" />
                    <span className="hidden md:inline">Sign In</span>
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
