import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Team } from '@/types';
import { Users, MessageCircle, LogOut, Trash2, X } from 'lucide-react';

export default function TeamList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [leavingTeam, setLeavingTeam] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmationTeam, setConfirmationTeam] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
        showToast('Failed to load teams', 'error');
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  const handleLeaveTeam = async (teamId: string) => {
    if (!user || !window.confirm('Are you sure you want to leave this team?')) return;

    setLeavingTeam(teamId);
    try {
      const teamRef = doc(db, 'teams', teamId);
      const team = teams.find(t => t.id === teamId);

      if (team) {
        const updatedMembers = team.members.filter(memberId => memberId !== user.uid);
        await updateDoc(teamRef, {
          members: updatedMembers
        });

        setTeams(prev => prev.filter(t => t.id !== teamId));

        showToast(`You have left the team: ${team.name}`);
      }
    } catch (error) {
      showToast('Failed to leave team', 'error');
      console.error('Error leaving team:', error);
    } finally {
      setLeavingTeam(null);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    setConfirmationTeam(teamId);
  };

  const deleteTeam = async () => {
    if (!confirmationTeam) return;

    setDeletingTeam(confirmationTeam);
    try {
      const teamRef = doc(db, 'teams', confirmationTeam);
      const team = teams.find(t => t.id === confirmationTeam);

      if (team && team.createdBy === user?.uid) {
        await deleteDoc(teamRef);
        setTeams(prev => prev.filter(t => t.id !== confirmationTeam));
        showToast(`Team ${team.name} has been deleted`);
      }
    } catch (error) {
      showToast('Failed to delete team', 'error');
      console.error('Error deleting team:', error);
    } finally {
      setDeletingTeam(null);
      setConfirmationTeam(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="mt-20">
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md ${
            toast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmationTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full relative">
              <button 
                onClick={() => setConfirmationTeam(null)} 
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div className="text-center">
                <Trash2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-600 mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Delete Team Permanently
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  This will permanently delete the team and remove all members. 
                  You cannot undo this action.
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmationTeam(null)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={deleteTeam}
                    disabled={deletingTeam === confirmationTeam}
                    className="w-full sm:w-auto"
                  >
                    {deletingTeam === confirmationTeam ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">Your Teams</h1>
            <Link to="/create-team">
              <Button className="w-full sm:w-auto">
                <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Create New Team
              </Button>
            </Link>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
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
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                >
                  <div className="w-full sm:w-auto">
                    <h3 className="font-medium">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                    )}
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">
                        {team.members.length} members
                      </span>
                      {team.createdBy === user?.uid && (
                        <span className="ml-2 text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Team Leader
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Link to={`/team/${team.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat
                      </Button>
                    </Link>
                    {team.createdBy !== user?.uid && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeaveTeam(team.id)}
                        disabled={leavingTeam === team.id}
                        className="w-full sm:w-auto text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {leavingTeam === team.id ? 'Leaving...' : 'Leave'}
                      </Button>
                    )}
                    {team.createdBy === user?.uid && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                        disabled={deletingTeam === team.id}
                        className="w-full sm:w-auto text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingTeam === team.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}