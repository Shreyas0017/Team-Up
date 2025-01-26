import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { User, ConnectionRequest } from '@/types';
import { Users, Plus, X, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionRequest[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchConnections = async () => {
      try {
        setLoading(true);
        
        // Fetch accepted connection requests
        const requestsRef = collection(db, 'teamRequests');
        const acceptedRequestsQuery = query(
          requestsRef, 
          where('status', '==', 'accepted'),
          where('senderId', '==', user.uid) || 
          where('receiverId', '==', user.uid)
        );
        const acceptedRequestsSnapshot = await getDocs(acceptedRequestsQuery);
        const acceptedRequests = acceptedRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ConnectionRequest));
        setAcceptedConnections(acceptedRequests);

        // Get unique connected user IDs
        const connectedUserIds = new Set<string>();
        acceptedRequests.forEach(request => {
          if (request.senderId !== user.uid) connectedUserIds.add(request.senderId);
          if (request.receiverId !== user.uid) connectedUserIds.add(request.receiverId);
        });

        if (connectedUserIds.size === 0) {
          setConnections([]);
          setLoading(false);
          return;
        }

        // Fetch user details for connected users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(
          query(usersRef, where('uid', 'in', Array.from(connectedUserIds)))
        );
        
        const connectionsData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));

        setConnections(connectionsData);
      } catch (error) {
        console.error('Error fetching connections:', error);
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
      // Create team (implementation remains the same as before)
      const teamsRef = collection(db, 'teams');
      const teamDoc = await addDoc(teamsRef, {
        name: teamName.trim(),
        description: teamDescription.trim(),
        createdBy: user.uid,
        members: [user.uid, ...selectedMembers],
        createdAt: new Date().toISOString()
      });

      // Create initial welcome message in subcollection
      const messagesRef = collection(db, 'teams', teamDoc.id, 'messages');
      await addDoc(messagesRef, {
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

  const filteredConnections = connections.filter(connection => {
    if (!connection) return false;
    
    const nameMatch = connection.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const skillMatch = connection.skills?.some(skill => 
      skill?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || false;

    return nameMatch || skillMatch;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-blue-900 flex items-center">
          <Users className="mr-4 text-blue-500" />
          Create a New Team
        </h1>
      </motion.div>

      {/* Team Details */}
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name..."
              />
              {teamName && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Description</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              rows={4}
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Describe your team's goals..."
            />
          </div>
        </motion.div>

        {/* Member Selection */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center">
            <Plus className="mr-2 text-blue-500" />
            Select Team Members
          </h2>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search connections by name or skill..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {filteredConnections.length === 0 ? (
          <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-50 rounded-xl"
        >
          <Users className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900">No connections found</h3>
          <p className="mt-2 text-gray-600">
            Connect with other users to add them to your team
          </p>
        </motion.div>
          ) : (
            <AnimatePresence>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConnections.map((connection) => (
                  <motion.div
                    key={connection.uid}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`p-5 rounded-xl border transition-all duration-300 ${
                      selectedMembers.includes(connection.uid) 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      {connection.photoURL ? (
                        <img
                          src={connection.photoURL}
                          alt={connection.displayName}
                          className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-8 w-8 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-blue-900">{connection.displayName}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {connection.experience} Developer
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {connection.bio && (
                        <p className="text-sm text-gray-500 line-clamp-2">{connection.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {connection.skills?.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {connection.skills?.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{connection.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      className="mt-4 w-full"
                      variant={selectedMembers.includes(connection.uid) ? 'primary' : 'outline'}
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
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end space-x-4 mt-8"
        >
          <Button 
            variant="outline" 
            onClick={() => navigate('/teams')}
            className="hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTeam}
            disabled={creating || !teamName.trim() || selectedMembers.length === 0}
            className="flex items-center space-x-2"
          >
            {creating ? (
              <>
                <div className="animate-spin mr-2">
                  <Users className="h-4 w-4" />
                </div>
                Creating...
              </>
            ) : (
              'Create Team'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  </motion.div>
);
}