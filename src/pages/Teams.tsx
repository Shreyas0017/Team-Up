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
  Layout, Briefcase, LineChart 
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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => ({
            uid: doc.id,
            ...doc.data()
          } as User));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
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

    fetchUsers();
    fetchRequests();
  }, [user]);

  const handleConnect = async (targetUser: User) => {
    if (!user) return;
    
    // Check if a request already exists
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
    } catch (error) {
      console.error('Error removing connection:', error);
    }
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
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
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
          <div className="flex gap-4 mb-6">
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
            <div className="flex gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(targetUser => (
          <div 
            key={targetUser.uid} 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
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
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {targetUser.bio}
              </p>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {targetUser.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm"
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

      {/* Received Connection Requests */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">
          Received Connection Requests
        </h3>
        {requests.filter(req => 
          req.receiverId === user?.uid && 
          req.status === 'pending'
        ).length > 0 ? (
          requests
            .filter(req => req.receiverId === user?.uid && req.status === 'pending')
            .map((req) => (
              <div 
                key={req.id} 
                className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {req.senderPhoto ? (
                    <img 
                      src={req.senderPhoto} 
                      alt={req.senderName} 
                      className="w-10 h-10 rounded-full mr-3 object-cover" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700 block">
                      {req.senderName}
                    </span>
                    <span className="text-sm text-gray-500">
                      Wants to connect
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAcceptRequest(req)}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(req)}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-6">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No pending connection requests</p>
          </div>
        )}
      </div>

      {/* Sent Connection Requests */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">
          Sent Connection Requests
        </h3>
        {requests.filter(req => 
          req.senderId === user?.uid && 
          req.status === 'pending'
        ).length > 0 ? (
          requests
            .filter(req => req.senderId === user?.uid && req.status === 'pending')
            .map((req) => (
              <div 
                key={req.id} 
                className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {req.receiverPhoto ? (
                    <img 
                      src={req.receiverPhoto} 
                      alt={req.receiverName} 
                      className="w-10 h-10 rounded-full mr-3 object-cover" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700 block">
                      {req.receiverName}
                    </span>
                    <span className="text-sm text-gray-500">
                      Request Pending
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleRemoveConnection(req)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Cancel Request
                </Button>
              </div>
            ))
        ) : (
          <div className="text-center py-6">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No sent connection requests</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
