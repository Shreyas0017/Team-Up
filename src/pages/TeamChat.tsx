import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Team, Message, User } from '@/types';
import { Send, Users, Info, Clock, UserPlus, Zap, Copy, Check, X, Menu } from 'lucide-react';
import { formatDistance } from 'date-fns';

function TeamChat() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [copyLinkStatus, setCopyLinkStatus] = useState<'copy' | 'copied'>('copy');
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Generate Invite Link
  const generateInviteLink = async () => {
    if (!teamId || !user) return;

    try {
      const inviteRef = doc(collection(db, 'team-invites'));
      await setDoc(inviteRef, {
        teamId: teamId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });

      const link = `${window.location.origin}/join-team/${inviteRef.id}`;
      setInviteLink(link);
      setShowInviteLink(true);
      toast.success('Invite link generated successfully!');
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
    }
  };

  // Copy Invite Link
  const copyInviteLink = () => {
    if (!inviteLink) return;

    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopyLinkStatus('copied');
      toast.success('Invite link copied to clipboard');
      
      setTimeout(() => {
        setCopyLinkStatus('copy');
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy invite link');
    });
  };

  // Close Invite Link Section
  const closeInviteLink = () => {
    setShowInviteLink(false);
    setInviteLink('');
  };

  // Handle Team Join
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
    if (!teamId) return;

    const fetchTeam = async () => {
      const teamRef = collection(db, 'teams');
      const teamQuery = query(teamRef, where('__name__', '==', teamId));
      const teamSnapshot = await getDocs(teamQuery);
      if (!teamSnapshot.empty) {
        const teamData = { id: teamSnapshot.docs[0].id, ...teamSnapshot.docs[0].data() } as Team;
        setTeam(teamData);
    
        const membersData = await Promise.all(
          (teamData.members || []).map(async (memberId) => {
            const memberDocRef = doc(db, 'users', memberId);
            const memberDocSnap = await getDoc(memberDocRef);
            return {
              uid: memberDocSnap.id,
              ...memberDocSnap.data(),
              displayName: memberDocSnap.data()?.displayName || 'Anonymous'
            } as User;
          })
        );
        
        setMembers(membersData);
      }
    };
    fetchTeam();

    const messagesRef = collection(db, 'teams', teamId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(newMessages);
      scrollToBottom();
    });

    // Add touch events for mobile
    const chatContainer = chatContainerRef.current;
    let touchStartY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      scrollTop = chatContainer?.scrollTop || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!chatContainer) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      chatContainer.scrollTop = scrollTop + diff;
      
      if (
        (chatContainer.scrollTop === 0 && diff < 0) ||
        (chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight && diff > 0)
      ) {
        e.preventDefault();
      }
    };

    if (chatContainer) {
      chatContainer.addEventListener('touchstart', handleTouchStart);
      chatContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      unsubscribe();
      if (chatContainer) {
        chatContainer.removeEventListener('touchstart', handleTouchStart);
        chatContainer.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [teamId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !teamId || !newMessage.trim()) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'teams', teamId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        senderPhoto: user.photoURL || '',
        content: newMessage.trim(),
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const toggleMemberDetails = (memberId: string) => {
    setShowMemberDetails(showMemberDetails === memberId ? null : memberId);
  };

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-pulse text-blue-500 flex items-center space-x-2">
          <Clock className="h-6 w-6 animate-spin" />
          <span className="text-xl font-semibold">Loading Team...</span>
        </div>
      </div>
    );
  }

  const MembersList = () => (
    <div className="space-y-3">
      {members && members.length > 0 ? (
        members.map((member) => {
          const displayName = member.displayName || 'Anonymous';
          const photoURL = member.photoURL || '';
          const experience = member.experience || 'Unknown';
          const initialLetter = displayName ? displayName.charAt(0) : '?';

          return (
            <div 
              key={member.uid} 
              className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => toggleMemberDetails(member.uid)}
            >
              <div className="flex items-center space-x-3">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-10 w-10 rounded-full border-2 border-blue-200"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">
                      {initialLetter}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{displayName}</p>
                  <p className="text-xs text-blue-600 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    {experience} Developer
                  </p>
                </div>
              </div>
              {showMemberDetails === member.uid && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-gray-700">
                  <p><strong>Experience:</strong> {experience}</p>
                  {member.email && <p><strong>Email:</strong> {member.email}</p>}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p className="text-gray-500 text-center">No team members found</p>
      )}
    </div>
  );
  
  return (
    <div className="mt-0 sm:mt-20">
      <ToastContainer position="top-right" />
      <div className="w-full max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
        <div className="bg-white h-screen sm:h-[calc(100vh-4rem)] sm:rounded-2xl shadow-xl overflow-hidden border border-blue-100 flex flex-col lg:flex-row">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Team Header */}
            <div className="p-2 sm:p-4 border-b bg-blue-50 flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-lg sm:text-2xl font-bold text-blue-800">{team?.name}</h1>
                <Button
                  variant="ghost"
                  className="ml-2 lg:hidden"
                  onClick={() => setShowMobileMembers(!showMobileMembers)}
                >
                  <Users className="h-5 w-5" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="text-blue-600 hover:bg-blue-50"
                onClick={generateInviteLink}
              >
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                <span className="hidden sm:inline">Invite Members</span>
              </Button>
            </div>

            {/* Invite Link Section */}
            {showInviteLink && inviteLink && (
              <div className="p-2 sm:p-4 bg-blue-50 flex flex-col sm:flex-row items-start sm:items-center justify-between relative space-y-2 sm:space-y-0">
                <div className="flex-1 w-full sm:mr-4">
                  <p className="text-sm text-blue-800 font-medium">Share this invite link</p>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}${inviteLink}`} 
                    className="w-full text-sm bg-white rounded-md p-2 mt-2 truncate"
                  />
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={copyInviteLink}
                    className="flex-1 sm:flex-none text-blue-600 hover:bg-blue-100"
                  >
                    {copyLinkStatus === 'copy' ? (
                      <Copy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    ) : (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500" />
                    )}
                    {copyLinkStatus === 'copy' ? 'Copy' : 'Copied!'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeInviteLink}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            )}
  
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === user?.uid;
                const senderName = message.senderName || 'Anonymous';
                const senderPhoto = message.senderPhoto || '';
                const messageTime = formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true });
  
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-1 sm:space-x-2 group max-w-[85%] sm:max-w-[75%]`}>
                      {senderPhoto ? (
                        <img
                          src={senderPhoto}
                          alt={senderName}
                          className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-blue-200 transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-xs sm:text-sm font-bold">
                            {senderName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl relative ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <span className="text-xs opacity-50 block text-right mt-1">
                          {messageTime}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
  
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 ease-in-out text-sm sm:text-base"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                />
                <Button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                  className="rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </form>
          </div>
  
          {/* Team Members Sidebar */}
          <div className="hidden lg:block w-72 border-l bg-gray-50 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-blue-800">
              <Users className="h-5 w-5 mr-2" />
              Team Members ({members.length})
            </h2>
            <div className="space-y-3">
              {members && members.length > 0 ? (
                members.map((member) => {
                  const displayName = member.displayName || 'Anonymous';
                  const photoURL = member.photoURL || '';
                  const experience = member.experience || 'Unknown';
                  const initialLetter = displayName ? displayName.charAt(0) : '?';
  
                  return (
                    <div 
                      key={member.uid} 
                      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => toggleMemberDetails(member.uid)}
                    >
                      <div className="flex items-center space-x-3">
                        {photoURL ? (
                          <img
                            src={photoURL}
                            alt={displayName}
                            className="h-10 w-10 rounded-full border-2 border-blue-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-bold">
                              {initialLetter}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{displayName}</p>
                          <p className="text-xs text-blue-600 flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            {experience} Developer
                          </p>
                        </div>
                      </div>
                      {showMemberDetails === member.uid && (
                        <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-gray-700">
                          <p><strong>Experience:</strong> {experience}</p>
                          {member.email && <p><strong>Email:</strong> {member.email}</p>}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center">No team members found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamChat;