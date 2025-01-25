import { Link } from 'react-router-dom';
import { Users, Rocket, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';


export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6 leading-tight">
            Find Your Perfect Hackathon Team
          </h1>
          <p className="mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
            Connect with fellow students, form balanced teams, and create amazing projects together. 
            Whether you're a beginner or experienced, TeamUp helps you find the right teammates.
          </p>
          <div className="flex justify-center space-x-4">
            {user ? (
              <Link to="/teams">
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                  Find Teams
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                  Get Started
                  <Users className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Skill-Based Matching",
              description: "Find teammates with complementary skills to build a balanced and effective team.",
              color: "text-blue-600"
            },
            {
              icon: Calendar,
              title: "Schedule Coordination",
              description: "Easily align your availability with potential teammates to ensure smooth collaboration.",
              color: "text-green-600"
            },
            {
              icon: MessageSquare,
              title: "Team Communication",
              description: "Built-in tools for seamless communication and project coordination with your team.",
              color: "text-purple-600"
            }
          ].map(({ icon: Icon, title, description, color }) => (
            <div 
              key={title} 
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-2"
            >
              <Icon className={`h-12 w-12 ${color} mb-4`} />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to find your team?</h2>
          <p className="mx-auto max-w-2xl text-xl text-blue-100 mb-10">
            Join hundreds of students who have found their perfect hackathon teams through TeamUp.
          </p>
          <div className="flex justify-center">
            {user ? (
              <Link to="/profile">
                <Button variant="secondary" size="lg" className="shadow-lg hover:shadow-xl">
                  Complete Your Profile
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="lg" className="shadow-lg hover:shadow-xl">
                  Sign Up Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}