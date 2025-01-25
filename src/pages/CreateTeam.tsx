import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';
import { Users } from 'lucide-react';

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchConnections = async () => {
      try {
        setLoading(true);
        const requestsRef = collection(db, 'teamRequests');
        
        // Fetch sent and received accepted requests
        const sentRequestsQuery = query(
          requestsRef,
          where('senderId', '==', user.uid),
          where('status', '==', 'accepted')
        );
        const receivedRequestsQuery = query(
          requestsRef,
          where('receiverId', '==', user.uid),
          where('status', '==', 'accepted')
        );

        const [sentRequestsSnapshot, receivedRequestsSnapshot] = await Promise.all([
          getDocs(sentRequestsQuery),
          getDocs(receivedRequestsQuery)
        ]);

        // Collect unique user IDs from both sent and received requests
        const connectedUserIds = new Set<string>();
        sentRequestsSnapshot.docs.forEach(doc => {
          connectedUserIds.add(doc.data().receiverId);
        });
        receivedRequestsSnapshot.docs.forEach(doc => {
          connectedUserIds.add(doc.data().senderId);
        });

        // Fetch user details for connected users
        if (connectedUserIds.size > 0) {
          const usersRef = collection(db, 'users');
          const usersQuery = query(
            usersRef,
            where('uid', 'in', Array.from(connectedUserIds))
          );
          
          const usersSnapshot = await getDocs(usersQuery);
          const usersData = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          } as User));

          setConnections(usersData);
        } else {
          setConnections([]);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [user]);

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim() || selectedMembers.length === 0) return;

    setCreating(true);
    try {
      // Create team
      const teamsRef = collection(db, 'teams');
      const teamDoc = await addDoc(teamsRef, {
        name: teamName.trim(),
        description: teamDescription.trim(),
        createdBy: user.uid,
        members: [user.uid, ...selectedMembers],
        createdAt: new Date().toISOString()
      });

      // Create initial welcome message
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        teamId: teamDoc.id,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        content: `Welcome to ${teamName}! Let's build something amazing together! 🚀`,
        createdAt: new Date().toISOString()
      });

      navigate(`/team/${teamDoc.id}`);
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create a New Team</h1>

        <div className="space-y-6">
          {/* Team Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Team Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Describe your team's goals..."
              />
            </div>
          </div>

          {/* Member Selection */}
          <div>
          <h2 className="text-lg font-semibold mb-4">Select Team Members</h2>
          {connections.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No connections yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect with other users to add them to your team
              </p>
            </div>
            ) : (
              <div className="grid gap-4">
                {connections.map((connection) => (
                  <div
                    key={connection.uid}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {connection.photoURL ? (
                        <img
                          src={connection.photoURL}
                          alt={connection.displayName}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{connection.displayName}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {connection.experience} Developer
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={selectedMembers.includes(connection.uid) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedMembers(prev =>
                          prev.includes(connection.uid)
                            ? prev.filter(id => id !== connection.uid)
                            : [...prev, connection.uid]
                        );
                      }}
                    >
                      {selectedMembers.includes(connection.uid) ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate('/teams')}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={creating || !teamName.trim() || selectedMembers.length === 0}
            >
              {creating ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}