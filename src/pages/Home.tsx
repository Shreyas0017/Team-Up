import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Rocket, Calendar, MessageSquare, ChevronRight, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';

export default function Home() {
  const { user } = useAuth();
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const features = [
    {
      icon: Users,
      title: "Skill-Based Matching",
      description: "Find teammates with complementary skills to build a balanced and effective team.",
      color: "text-blue-600",
      gradient: "from-blue-50 to-blue-100"
    },
    {
      icon: Calendar,
      title: "Schedule Coordination",
      description: "Easily align your availability with potential teammates to ensure smooth collaboration.",
      color: "text-green-600",
      gradient: "from-green-50 to-green-100"
    },
    {
      icon: MessageSquare,
      title: "Team Communication",
      description: "Built-in tools for seamless communication and project coordination with your team.",
      color: "text-purple-600",
      gradient: "from-purple-50 to-purple-100"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Team Up - Home</title>
        <meta name="description" content="Welcome to Team Up - Start collaborating with your team" />
      </Helmet>
      <div className="mt-20">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white overflow-hidden">
          {/* Hero Section */}
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto px-4 py-20 text-center relative"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-100/20 to-white/10 -z-10 opacity-50"></div>
            <div className="max-w-4xl mx-auto relative">
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6 leading-tight"
              >
                Find Your Perfect Hackathon Team
              </motion.h1>
              <p className="mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
                Connect with fellow students, form balanced teams, and create amazing projects together. 
                Whether you're a beginner or experienced, TeamUp helps you find the right teammates.
              </p>
              <div className="flex justify-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {user ? (
                    <Link to="/teams">
                      <Button size="lg" className="shadow-lg hover:shadow-xl transition-all group">
                        Find Teams
                        <Rocket className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button size="lg" className="shadow-lg hover:shadow-xl transition-all group">
                        Get Started
                        <Users className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Features Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, color, gradient }) => (
                <motion.div 
                  key={title} 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all transform relative overflow-hidden group`}
                  onMouseEnter={() => setHoveredFeature(title)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className="absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className="h-32 w-32" />
                  </div>
                  <Icon className={`h-12 w-12 ${color} mb-4 relative z-10`} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 relative z-10">{title}</h3>
                  <p className="text-gray-600 leading-relaxed relative z-10">{description}</p>
                  {hoveredFeature === title && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute bottom-4 right-4 text-blue-600"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-20"></div>
            <div className="container mx-auto px-4 text-center relative z-10">
              <motion.h2 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold mb-6 flex justify-center items-center"
              >
                Ready to find your team? 
                <Star className="ml-4 text-yellow-300 animate-pulse" />
              </motion.h2>
              <p className="mx-auto max-w-2xl text-xl text-blue-100 mb-10">
                Join hundreds of students who have found their perfect hackathon teams through TeamUp.
              </p>
              <div className="flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {user ? (
                    <Link to="/profile">
                      <Button variant="secondary" size="lg" className="shadow-lg hover:shadow-xl group">
                        Complete Your Profile
                        <Check className="ml-2 h-5 w-5 group-hover:scale-125 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button variant="secondary" size="lg" className="shadow-lg hover:shadow-xl group">
                        Sign Up Now
                        <Users className="ml-2 h-5 w-5 group-hover:scale-125 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Footer Section */}
          <footer className="bg-gray-50 border-t border-gray-200">
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Up</h3>
                  <p className="text-gray-600 text-sm">
                    Connecting students for successful hackathon collaborations.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                  <ul className="space-y-2">
                    <li><Link to="/teams" className="text-gray-600 hover:text-blue-600 text-sm">Find Teams</Link></li>
                    <li><Link to="/profile" className="text-gray-600 hover:text-blue-600 text-sm">Profile</Link></li>
                    <li><Link to="/chat" className="text-gray-600 hover:text-blue-600 text-sm">Messages</Link></li>
                  </ul>
                </div>

                {/* Resources */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Help Center</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Guidelines</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">FAQ</a></li>
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                  <ul className="space-y-2">
                    <li className="text-gray-600 text-sm">Email: tb123983@gmail.com</li>
                    <li>
                      <a 
                        href="https://x.com/sahnik_biswas" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-blue-600 text-sm inline-flex items-center"
                      >
                        Twitter: @sahnik_biswas
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://github.com/Sahnik0" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-blue-600 text-sm inline-flex items-center"
                      >
                        GitHub: Sahnik0
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://www.linkedin.com/in/sahnik-biswas-8514012a7/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-blue-600 text-sm inline-flex items-center"
                      >
                        LinkedIn: Sahnik Biswas
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-8 pt-8 text-center">
                <p className="text-gray-600 text-sm">
                  © {new Date().getFullYear()} Team Up. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
