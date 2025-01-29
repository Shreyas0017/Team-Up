import { useState, useEffect } from 'react';
import { Team } from '@/types';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { collection, query, where, getDocs, deleteDoc, arrayRemove } from 'firebase/firestore';
import { Users, MessageCircle, LogOut, Edit, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { User, Skill, SkillLevel, SkillCategory, ExperienceLevel } from '@/types';
import { 
  Code, Palette, Phone, Database, Layout, Briefcase, LineChart, 
  Trash2, PlusCircle, Check, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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

  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    skills: true,
    socialLinks: true,
    teams: true
  });

  const [previewProfile, setPreviewProfile] = useState(false);

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

    fetchUserTeams();
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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
  
  const handleLeaveTeam = async (teamId: string) => {
    if (!user) return;
  
    try {
      const teamRef = doc(db, 'teams', teamId);
      
      await updateDoc(teamRef, {
        members: arrayRemove(user.uid)
      });
  
      setUserTeams(prev => prev.filter(team => team.id !== teamId));
  
      toast.success('Successfully left the team');
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };
  
  const handleDeleteTeam = async (teamId: string) => {
    if (!user) return;
  
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists() && teamDoc.data().createdBy === user.uid) {
        await deleteDoc(teamRef);
        
        setUserTeams(prev => prev.filter(team => team.id !== teamId));
  
        toast.success('Team deleted successfully');
      } else {
        toast.error('You do not have permission to delete this team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const renderSkillLevelIndicator = (level: SkillLevel) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[level]}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const renderProfilePreview = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-end mb-4">
          <button onClick={() => setPreviewProfile(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-start">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.displayName || "No Name Set"}</h2>
            <p className="text-gray-500 capitalize">{profile.experience || "No Experience Set"} Developer</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">About</h3>
          <p className="text-gray-600">{profile.bio || "No bio set."}</p>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                {skillCategories.find(cat => cat.id === skill.category)?.icon}
                <span className="ml-2">{skill.name}</span>
                <span className="ml-1 text-gray-500">• {skill.level}</span>
              </span>
            ))}
          </div>
        </div>
        {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl) && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Links</h3>
            <div className="space-y-2">
              {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">GitHub Profile</a>}
              {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">LinkedIn Profile</a>}
              {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Portfolio Website</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-16 sm:mt-20">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-8 border border-gray-100 transform transition-all hover:scale-[1.01]">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8 mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Profile Settings
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto hover:bg-gray-100 transition-colors group"
              >
                <X className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform" /> Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-white"
              >
                {saving ? 'Saving...' : <><Check className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
              <Button 
                onClick={() => setPreviewProfile(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 transition-all text-white"
              >
                Preview My Profile
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <section className="mb-8 sm:mb-12">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('basicInfo')}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                Basic Information
              </h2>
              {expandedSections.basicInfo ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSections.basicInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-slide-down">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Bio</label>
                  <textarea
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    rows={4}
                    value={profile.bio || ''}
                    onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about your journey, interests, and goals..."
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {experienceLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => setProfile(prev => ({ ...prev, experience: level }))}
                        className={cn(
                          "py-2 px-4 rounded-lg transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 group",
                          profile.experience === level 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                        {profile.experience === level && <Star className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Skills Section */}
          <section className="mb-8 sm:mb-12">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('skills')}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center">
                <Star className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Skills
              </h2>
              {expandedSections.skills ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </div>

            {expandedSections.skills && (
              <div className="space-y-4 animate-slide-down">
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mb-4">
                  <input
                    type="text"
                    className="flex-grow rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 text-sm sm:text-base"
                    placeholder="Enter a new skill (e.g., React, Python)"
                    value={newSkill.name}
                    onChange={e => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <select
                      className="w-full sm:w-auto rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                      value={newSkill.category}
                      onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value as SkillCategory }))}
                    >
                      {skillCategories.map(category => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                      ))}
                    </select>
                    <select
                      className="w-full sm:w-auto rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
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
                      disabled={!newSkill.name}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all text-white disabled:opacity-50"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {profile.skills?.map((skill, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition-colors group"
                    >
                      <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                        {skillCategories.find(cat => cat.id === skill.category)?.icon}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:space-x-2">
                          <span className="font-medium text-gray-800">{skill.name}</span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {skill.category}
                          </span>
                          {renderSkillLevelIndicator(skill.level)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 sm:opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Social Links */}
          <section className="mb-8 sm:mb-12">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('socialLinks')}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                Social Links
              </h2>
              {expandedSections.socialLinks ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedSections.socialLinks && (
              <div className="grid md:grid-cols-2 gap-6 animate-slide-down">
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
            )}
          </section>

          {/* Teams Section */}
          <section>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('teams')}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                Your Teams
              </h2>
              {expandedSections.teams ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedSections.teams && (
              <div className="space-y-4 animate-slide-down">
                {userTeams.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Users className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No teams yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Join or create a team to get started
                    </p>
                  </div>
                ) : (
                  userTeams.map(team => (
                    <div
                      key={team.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                    >
                      <div className="w-full sm:w-auto">
                        <h3 className="font-medium">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        {team.createdBy === user?.uid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTeam(team.id)}
                            className="w-full sm:w-auto justify-center"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Team
                          </Button>
                        ) : (
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveTeam(team.id)}
                          className="w-full sm:w-auto justify-center"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Team
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/team/${team.id}`)}
                        className="w-full sm:w-auto justify-center"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Open Chat
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
    {previewProfile && renderProfilePreview()}
  </div>
  );
}