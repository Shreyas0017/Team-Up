import { useState, useEffect } from 'react';
import { Team } from '@/types';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, MessageCircle } from 'lucide-react';
import { User, Skill, SkillLevel, SkillCategory, ExperienceLevel } from '@/types';
import { 
  Code, Palette, Phone, Database, Layout, Briefcase, LineChart, 
  Trash2, PlusCircle, Check, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const skillCategories: { id: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'frontend', label: 'Frontend', icon: <Layout className="h-5 w-5 text-blue-500" /> },
  { id: 'backend', label: 'Backend', icon: <Database className="h-5 w-5 text-green-500" /> },
  { id: 'mobile', label: 'Mobile', icon: <Phone className="h-5 w-5 text-purple-500" /> },
  { id: 'design', label: 'Design', icon: <Palette className="h-5 w-5 text-pink-500" /> },
  { id: 'product', label: 'Product', icon: <Code className="h-5 w-5 text-indigo-500" /> },
  { id: 'business', label: 'Business', icon: <Briefcase className="h-5 w-5 text-yellow-500" /> },
  { id: 'data', label: 'Data', icon: <LineChart className="h-5 w-5 text-red-500" /> },
];

const skillLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const experienceLevels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [profile, setProfile] = useState<Partial<User>>({});
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    level: 'beginner',
    category: 'frontend',
  });

  useEffect(() => {
  
      const fetchUserTeams = async () => {
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
          setUserTeams(teamsData);
        } catch (error) {
          console.error('Error fetching teams:', error);
        }
      };
    
      fetchUserTeams();

    
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as User);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, profile);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.name) return;
    
    setProfile(prev => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill as Skill],
    }));
    
    setNewSkill({
      name: '',
      level: 'beginner',
      category: 'frontend',
    });
  };

  const handleRemoveSkill = (index: number) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-300 w-64 mb-4 rounded"></div>
          <div className="h-6 bg-gray-200 w-48 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 transition-colors"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {saving ? 'Saving...' : <><Check className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </div>
        </div>
        
        {/* Basic Information */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Bio</label>
              <textarea
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows={4}
                value={profile.bio || ''}
                onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about your journey, interests, and goals..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {experienceLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => setProfile(prev => ({ ...prev, experience: level }))}
                    className={cn(
                      "py-2 rounded-lg transition-all text-sm",
                      profile.experience === level 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Skills
          </h2>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-grow rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a new skill"
                value={newSkill.name}
                onChange={e => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
              />
              <select
                className="rounded-lg border-gray-300 focus:ring-blue-500"
                value={newSkill.category}
                onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value as SkillCategory }))}
              >
                {skillCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border-gray-300 focus:ring-blue-500"
                value={newSkill.level}
                onChange={e => setNewSkill(prev => ({ ...prev, level: e.target.value as SkillLevel }))}
              >
                {skillLevels.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
              <Button 
                onClick={handleAddSkill}
                className="bg-green-500 hover:bg-green-600"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>

            <div className="grid gap-3">
              {profile.skills?.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {skillCategories.find(cat => cat.id === skill.category)?.icon}
                    <div>
                      <span className="font-medium text-gray-800">{skill.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {skill.category} • {skill.level}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Teams Section */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold mb-4">Your Teams</h2>
  {userTeams.length === 0 ? (
    <div className="text-center py-8">
      <Users className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No teams yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Join or create a team to get started
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {userTeams.map(team => (
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
          <div className="flex items-center space-x-2">
            {team.createdBy === user?.uid && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Team Leader
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/team/${team.id}`)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Open Chat
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>


        {/* Social Links */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Social Links
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                GitHub Profile
              </label>
              <input
                type="url"
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={profile.githubUrl || ''}
                onChange={e => setProfile(prev => ({ ...prev, githubUrl: e.target.value }))}
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                LinkedIn Profile
              </label>
              <input
                type="url"
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={profile.linkedinUrl || ''}
                onChange={e => setProfile(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Portfolio Website
              </label>
              <input
                type="url"
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={profile.portfolioUrl || ''}
                onChange={e => setProfile(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}