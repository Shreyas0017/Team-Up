import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Team } from '@/types';
import { Users, MessageCircle } from 'lucide-react';

export default function TeamList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;

      try {
        const teamsRef = collection(db, 'teams');
        const teamsQuery = query(
          teamsRef,
          where('members', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(teamsQuery);
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Teams</h1>
          <Link to="/create-team">
            <Button>
              <Users className="mr-2 h-5 w-5" />
              Create New Team
            </Button>
          </Link>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teams yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new team or wait for invitations
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-gray-500">{team.description}</p>
                  )}
                </div>
                <Link to={`/team/${team.id}`}>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open Chat
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}