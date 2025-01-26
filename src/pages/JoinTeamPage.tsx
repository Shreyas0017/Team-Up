import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';

function JoinTeamPage() {
  const { inviteId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoinTeam = async (inviteId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a team');
      navigate('/login');
      return;
    }

    try {
      const inviteDocRef = doc(db, 'team-invites', inviteId);
      const inviteDoc = await getDoc(inviteDocRef);

      if (!inviteDoc.exists()) {
        toast.error('Invalid invite link');
        return;
      }

      const inviteData = inviteDoc.data();
      
      if (
        inviteData.status !== 'active' || 
        new Date(inviteData.expiresAt) < new Date()
      ) {
        toast.error('Invite link has expired');
        return;
      }

      const teamDocRef = doc(db, 'teams', inviteData.teamId);
      
      await updateDoc(teamDocRef, {
        members: arrayUnion(user.uid)
      });

      await updateDoc(inviteDocRef, {
        status: 'used',
        usedBy: user.uid,
        usedAt: new Date().toISOString()
      });

      toast.success('Successfully joined the team!');
      navigate(`/team/${inviteData.teamId}`);
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    }
  };

  useEffect(() => {
    if (inviteId) {
      if (!user) {
        navigate(`/login?redirect=/join-team/${inviteId}`);
        return;
      }

      handleJoinTeam(inviteId);
    }
  }, [inviteId, user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <div className="text-center">
        <Clock className="mx-auto h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-xl text-blue-700">Joining team...</p>
      </div>
    </div>
  );
}

export default JoinTeamPage;