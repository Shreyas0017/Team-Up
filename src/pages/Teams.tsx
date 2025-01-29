import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  or
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { User, SkillCategory, TeamRequest } from '@/types';
import { 
  Users, Search, Filter, Code, Palette, Phone, Database, 
  Layout, Briefcase, LineChart, X
} from 'lucide-react';
import { motion } from 'framer-motion';

const skillCategories: { id: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'frontend', label: 'Frontend', icon: <Layout className="h-5 w-5" /> },
  { id: 'backend', label: 'Backend', icon: <Database className="h-5 w-5" /> },
  { id: 'mobile', label: 'Mobile', icon: <Phone className="h-5 w-5" /> },
  { id: 'design', label: 'Design', icon: <Palette className="h-5 w-5" /> },
  { id: 'product', label: 'Product', icon: <Code className="h-5 w-5" /> },
  { id: 'business', label: 'Business', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'data', label: 'Data', icon: <LineChart className="h-5 w-5" /> },
];

export default function Teams() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<SkillCategory[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsersAndConnections = async () => {
      if (!user) return;

      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => ({
            uid: doc.id,
            ...doc.data(),
            connections: 0 // Initialize connections count
          } as User));

        // Fetch connections count
        const requestsRef = collection(db, 'teamRequests');
        const connectionsQuery = query(
          requestsRef, 
          where('status', '==', 'accepted')
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        
        connectionsSnapshot.forEach(doc => {
          const request = doc.data();
          const userIndex = usersData.findIndex(u => u.uid === request.senderId || u.uid === request.receiverId);
          if (userIndex !== -1) {
            usersData[userIndex].connections += 1;
          }
        });

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users and connections:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRequests = async () => {
      if (!user) return;
      try {
        const requestsRef = collection(db, 'teamRequests');
        const userRequestsQuery = query(
          requestsRef, 
          or(
            where('senderId', '==', user.uid),
            where('receiverId', '==', user.uid)
          )
        );

        const requestsSnapshot = await getDocs(userRequestsQuery);
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TeamRequest));

        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchUsersAndConnections();
    fetchRequests();
  }, [user]);

  const handleConnect = async (targetUser: User) => {
    if (!user) return;
    
    const existingRequest = requests.find(
      req => 
        (req.senderId === user.uid && req.receiverId === targetUser.uid) ||
        (req.senderId === targetUser.uid && req.receiverId === user.uid)
    );

    if (existingRequest) {
      console.log('Request already exists');
      return;
    }

    setConnectingTo(targetUser.uid);
    try {
      const requestsRef = collection(db, 'teamRequests');
      const newRequest = {
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        receiverId: targetUser.uid,
        receiverName: targetUser.displayName,
        status: 'pending',
        message: `Hi ${targetUser.displayName}, I'd like to connect and possibly team up!`,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(requestsRef, newRequest);
      setRequests(prev => [...prev, { ...newRequest, id: docRef.id }]);
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setConnectingTo(null);
    }
  };

  const handleAcceptRequest = async (request: TeamRequest) => {
    if (!user || user.uid !== request.receiverId) return;

    try {
      const requestDoc = doc(db, 'teamRequests', request.id);
      await updateDoc(requestDoc, { 
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });

      setRequests(prev => prev.map(req => 
        req.id === request.id ? { ...req, status: 'accepted' } : req
      ));
      // Update connections count for both users
      updateUserConnections(request.senderId, 1);
      updateUserConnections(request.receiverId, 1);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (request: TeamRequest) => {
    if (!user || user.uid !== request.receiverId) return;

    try {
      const requestDoc = doc(db, 'teamRequests', request.id);
      await updateDoc(requestDoc, { 
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });

      setRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleRemoveConnection = async (request: TeamRequest) => {
    if (!user) return;

    try {
      const requestDoc = doc(db, 'teamRequests', request.id);
      await deleteDoc(requestDoc);

      setRequests(prev => prev.filter(req => req.id !== request.id));
      // Decrease connections count for both users
      updateUserConnections(request.senderId, -1);
      updateUserConnections(request.receiverId, -1);
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const updateUserConnections = (userId: string, increment: number) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.uid === userId ? 
        { ...user, connections: user.connections + increment } : 
        user
      )
    );
  };

  const getRequestStatus = (targetUser: User) => {
    const existingRequest = requests.find(
      req => 
        (req.senderId === user?.uid && req.receiverId === targetUser.uid) ||
        (req.senderId === targetUser.uid && req.receiverId === user?.uid)
    );

    return existingRequest ? existingRequest.status : null;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.skills?.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSkills = selectedSkills.length === 0 ||
      user.skills?.some(skill => selectedSkills.includes(skill.category));

    const matchesExperience = selectedExperience.length === 0 ||
      selectedExperience.includes(user.experience);

    return matchesSearch && matchesSkills && matchesExperience;
  });

  const toggleSkill = (skillCategory: SkillCategory) => {
    setSelectedSkills(prev =>
      prev.includes(skillCategory)
        ? prev.filter(s => s !== skillCategory)
        : [...prev, skillCategory]
    );
  };

  const toggleExperience = (experience: string) => {
    setSelectedExperience(prev =>
      prev.includes(experience)
        ? prev.filter(e => e !== experience)
        : [...prev, experience]
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4 sm:mb-0">
            Find Teammates
          </h1>
          <Link to="/create-team">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-white">
              <Users className="mr-2 h-5 w-5" />
              Create Team
            </Button>
          </Link>
        </motion.div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search by name or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </Button>
          </div>

          {/* Skill Categories */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skillCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleSkill(category.id)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    selectedSkills.includes(category.id)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category.icon}
                  <span className="ml-2">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Experience Level</h3>
            <div className="flex gap-2 flex-wrap">
              {['beginner', 'intermediate', 'advanced'].map(level => (
                <button
                  key={level}
                  onClick={() => toggleExperience(level)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedExperience.includes(level)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map(targetUser => (
            <div 
              key={targetUser.uid} 
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedUser(targetUser)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {targetUser.photoURL ? (
                    <img
                      src={targetUser.photoURL}
                      alt={targetUser.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className="font-semibold">{targetUser.displayName}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {targetUser.experience} Developer
                    </p>
                    <p className="text-xs text-gray-500">
                      {targetUser.connections} Connections
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(targetUser);
                  }}
                  disabled={
                    connectingTo === targetUser.uid || 
                    getRequestStatus(targetUser) === 'pending'
                  }
                  className={`
                    ${getRequestStatus(targetUser) === 'accepted' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 text-white'}
                  `}
                >
                  {connectingTo === targetUser.uid 
                    ? 'Sending...' 
                    : getRequestStatus(targetUser) === 'pending'
                      ? 'Pending'
                      : getRequestStatus(targetUser) === 'accepted'
                        ? 'Connected'
                        : 'Connect'}
                </Button>
              </div>
              
              {targetUser.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {targetUser.bio}
                </p>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {targetUser.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs"
                    >
                      {skillCategories.find(cat => cat.id === skill.category)?.icon}
                      <span className="ml-1">{skill.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    {selectedUser.photoURL ? (
                      <img
                        src={selectedUser.photoURL}
                        alt={selectedUser.displayName}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-4">
                      <h2 className="text-2xl font-bold">{selectedUser.displayName}</h2>
                      <p className="text-gray-500 capitalize">{selectedUser.experience} Developer</p>
                      <p className="text-sm text-gray-500">
                        {selectedUser.connections} Connections
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {selectedUser.bio && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About</h3>
                      <p className="text-gray-600">{selectedUser.bio}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800"
                        >
                          {skillCategories.find(cat => cat.id === skill.category)?.icon}
                          <span className="ml-2">{skill.name}</span>
                          <span className="ml-1 text-gray-500">• {skill.level}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {(selectedUser.githubUrl || selectedUser.linkedinUrl || selectedUser.portfolioUrl) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Links</h3>
                      <div className="space-y-2">
                        {selectedUser.githubUrl && (
                          <a
                            href={selectedUser.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            GitHub Profile
                          </a>
                        )}
                        {selectedUser.linkedinUrl && (
                          <a
                            href={selectedUser.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            LinkedIn Profile
                          </a>
                        )}
                        {selectedUser.portfolioUrl && (
                          <a
                            href={selectedUser.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            Portfolio Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  {getRequestStatus(selectedUser) !== 'accepted' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(selectedUser);
                        setSelectedUser(null);
                      }}
                      disabled={connectingTo === selectedUser.uid}
                    >
                      {connectingTo === selectedUser.uid ? 'Sending Request...' : 'Send Connection Request'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}