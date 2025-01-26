import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  SkillCategory, 
  ConnectionRequest 
} from '@/types';
import { 
  Users, 
  Search, 
  Filter, 
  Code, 
  Palette, 
  Phone, 
  Database, 
  Layout, 
  Briefcase, 
  LineChart, 
  XCircle,
  Check,
  X
} from 'lucide-react';

const skillCategories: { id: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'frontend', label: 'Frontend', icon: <Layout className="h-5 w-5" /> },
  { id: 'backend', label: 'Backend', icon: <Database className="h-5 w-5" /> },
  { id: 'mobile', label: 'Mobile', icon: <Phone className="h-5 w-5" /> },
  { id: 'design', label: 'Design', icon: <Palette className="h-5 w-5" /> },
  { id: 'product', label: 'Product', icon: <Code className="h-5 w-5" /> },
  { id: 'business', label: 'Business', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'data', label: 'Data', icon: <LineChart className="h-5 w-5" /> },
];

const experienceLevels = ['beginner', 'intermediate', 'advanced'];

export default function Teams() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<SkillCategory[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'find' | 'requests'>('find');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all users except current user
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(query(usersRef, where('uid', '!=', user.uid)));
        const usersData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersData);

        // Fetch connections
        const connectionsRef = collection(db, 'teamRequests');
        const connectionsQuery = query(
          connectionsRef, 
          where('senderId', 'in', [user.uid, ...usersData.map(u => u.uid)]),
          where('receiverId', 'in', [user.uid, ...usersData.map(u => u.uid)]),
          orderBy('createdAt', 'desc')
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        const connectionsData = connectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ConnectionRequest));
        setConnections(connectionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getConnectionStatus = (targetUserId: string) => {
    const connection = connections.find(
      conn => 
        (conn.senderId === user?.uid && conn.receiverId === targetUserId) ||
        (conn.senderId === targetUserId && conn.receiverId === user?.uid)
    );

    if (!connection) return 'connect';
    
    if (connection.status === 'pending') {
      return connection.senderId === user?.uid ? 'pending' : 'accept';
    }
    
    return 'connected';
  };

  const handleConnect = async (targetUser: User) => {
    if (!user) return;
    
    const existingConnection = connections.find(
      conn => 
        (conn.senderId === user.uid && conn.receiverId === targetUser.uid) ||
        (conn.senderId === targetUser.uid && conn.receiverId === user.uid)
    );

    if (existingConnection && existingConnection.status !== 'declined') return;
    
    setConnectingTo(targetUser.uid);
    try {
      const requestsRef = collection(db, 'teamRequests');
      const newConnection = await addDoc(requestsRef, {
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        receiverId: targetUser.uid,
        receiverName: targetUser.displayName,
        receiverPhoto: targetUser.photoURL,
        status: 'pending',
        message: `Hi ${targetUser.displayName}, I'd like to connect and possibly team up!`,
        createdAt: new Date().toISOString()
      });

      // Update local state
      setConnections(prev => [...prev, {
        id: newConnection.id,
        senderId: user.uid,
        receiverId: targetUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setConnectingTo(null);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const connectionRef = doc(db, 'teamRequests', connectionId);
      await updateDoc(connectionRef, { status: 'connected' });

      // Update local state
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { ...conn, status: 'connected' } : conn
      ));
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    try {
      const connectionRef = doc(db, 'teamRequests', connectionId);
      await updateDoc(connectionRef, { status: 'declined' });

      // Update local state
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { ...conn, status: 'declined' } : conn
      ));
    } catch (error) {
      console.error('Error declining connection:', error);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await deleteDoc(doc(db, 'teamRequests', connectionId));
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const filteredUsers = users.filter(targetUser => {
    const connectionStatus = getConnectionStatus(targetUser.uid);
    
    const matchesSearch = !searchTerm || 
      targetUser.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetUser.skills?.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
    const matchesSkills = selectedSkills.length === 0 ||
      targetUser.skills?.some(skill => selectedSkills.includes(skill.category));
  
    const matchesExperience = selectedExperience.length === 0 ||
      selectedExperience.includes(targetUser.experience);
  
    return connectionStatus === 'connect' && matchesSearch && matchesSkills && matchesExperience;
  });

  const getPendingConnections = () => {
    return connections.filter(
      conn => 
        (conn.receiverId === user?.uid && conn.status === 'pending') ||
        (conn.senderId === user?.uid && conn.status === 'pending')
    );
  };

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Find Teammates</h1>
        <Link to="/create-team">
          <Button>
            <Users className="mr-2 h-5 w-5" />
            Create Team
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab('find')}
          className={`px-4 py-2 ${activeTab === 'find' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Find Teammates
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Connection Requests
        </button>
      </div>

      {activeTab === 'find' ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex space-x-4 mb-4">
              <div className="flex-grow relative">
                <input
                  type="text"
                  placeholder="Search by name or skill"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-3 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-500" />
                <div className="relative">
                  <button 
                    className="flex items-center bg-gray-100 px-3 py-2 rounded-md"
                    onClick={() => {
                      const dropdown = document.getElementById('skill-dropdown');
                      dropdown?.classList.toggle('hidden');
                    }}
                  >
                    Skills {selectedSkills.length > 0 && `(${selectedSkills.length})`}
                  </button>
                  <div 
                    id="skill-dropdown" 
                    className="absolute z-10 w-64 bg-white border rounded-md shadow-lg mt-2 hidden"
                  >
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {skillCategories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(category.id)}
                            onChange={() => toggleSkill(category.id)}
                            className="form-checkbox"
                          />
                          <span className="flex items-center">
                            {category.icon}
                            <span className="ml-2">{category.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    className="flex items-center bg-gray-100 px-3 py-2 rounded-md"
                    onClick={() => {
                      const dropdown = document.getElementById('experience-dropdown');
                      dropdown?.classList.toggle('hidden');
                    }}
                  >
                    Experience {selectedExperience.length > 0 && `(${selectedExperience.length})`}
                  </button>
                  <div 
                    id="experience-dropdown" 
                    className="absolute z-10 w-48 bg-white border rounded-md shadow-lg mt-2 hidden"
                  >
                    <div className="p-4 space-y-2">
                      {experienceLevels.map((level) => (
                        <label key={level} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedExperience.includes(level)}
                            onChange={() => toggleExperience(level)}
                            className="form-checkbox"
                          />
                          <span className="capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(targetUser => (
              <div 
                key={targetUser.uid} 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedUser(targetUser)}
              >
                <div className="flex items-center space-x-4 mb-4">
                  {targetUser.photoURL ? (
                    <img
                      src={targetUser.photoURL}
                      alt={targetUser.displayName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{targetUser.displayName}</h3>
                    <p className="text-gray-600 capitalize">{targetUser.experience} Developer</p>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {targetUser.skills?.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="                         inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800"
                      >
                        {skillCategories.find(cat => cat.id === skill.category)?.icon}
                        <span className="ml-2">{skill.name}</span>
                        <span className="ml-1 text-gray-500 text-sm">• {skill.level}</span>
                      </span>
                    ))}
                  </div>
                  {targetUser.skills?.length > 3 && (
                    <p className="text-sm text-gray-500 mt-2">
                      + {targetUser.skills.length - 3} more skills
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(targetUser);
                  }}
                  disabled={connectingTo === targetUser.uid}
                  variant={getConnectionStatus(targetUser.uid) === 'pending' ? 'outline' : 'default'}
                >
                  {getConnectionStatus(targetUser.uid) === 'pending' 
                    ? 'Pending' 
                    : (connectingTo === targetUser.uid ? 'Sending...' : 'Connect')}
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Connection Requests</h2>

          {/* Incoming Requests */}
          <div>
            <h3 className="text-lg font-medium mb-2">Incoming Requests</h3>
            {connections.filter(conn => conn.receiverId === user?.uid && conn.status === 'pending').map(request => (
              <div 
                key={request.id} 
                className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mb-2"
              >
                <div className="flex items-center">
                  <img 
                    src={request.senderPhoto || '/default-avatar.png'} 
                    alt={request.senderName} 
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold">{request.senderName}</p>
                    <p className="text-sm text-gray-500">{request.message}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAcceptConnection(request.id)}
                  >
                    <Check className="mr-2 h-4 w-4" /> Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeclineConnection(request.id)}
                  >
                    <X className="mr-2 h-4 w-4" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Outgoing Requests */}
          <div>
            <h3 className="text-lg font-medium mb-2">Sent Requests</h3>
            {connections.filter(conn => conn.senderId === user?.uid && conn.status === 'pending').map(request => (
              <div 
                key={request.id} 
                className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mb-2"
              >
                <div className="flex items-center">
                  <img 
                    src={request.receiverPhoto || '/default-avatar.png'} 
                    alt={request.receiverName} 
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold">{request.receiverName}</p>
                    <p className="text-sm text-gray-500">Pending approval</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRemoveConnection(request.id)}
                >
                  Cancel Request
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <XCircle className="w-8 h-8" />
            </button>

            {/* User Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center space-x-4 mb-6">
                {selectedUser.photoURL ? (
                  <img
                    src={selectedUser.photoURL}
                    alt={selectedUser.displayName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.displayName}</h2>
                  <p className="text-gray-600 capitalize">
                    {selectedUser.experience} Developer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
