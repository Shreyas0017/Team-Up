import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  setDoc 
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Team, Message, User } from '@/types';
import { Send, Users, Info, Clock, UserPlus, Zap, Copy, Check, X } from 'lucide-react';
import { formatDistance } from 'date-fns';

function TeamChat() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [copyLinkStatus, setCopyLinkStatus] = useState<'copy' | 'copied'>('copy');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to generate invite link
  const generateInviteLink = async () => {
    if (!teamId || !user) return;

    try {
      // Create an invite document in a separate 'team-invites' collection
      const inviteRef = doc(collection(db, 'team-invites'));
      await setDoc(inviteRef, {
        teamId: teamId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
      });

      // Construct invite link with proper routing
      const link = `/join-team/${inviteRef.id}`;
      setInviteLink(link);
      setShowInviteLink(true);
      toast.success('Invite link generated successfully!');
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
    }
  };

  // Function to copy invite link
  const copyInviteLink = () => {
    if (!inviteLink) return;

    // Use full URL for copying
    const fullLink = `${window.location.origin}${inviteLink}`;

    navigator.clipboard.writeText(fullLink).then(() => {
      setCopyLinkStatus('copied');
      toast.success('Invite link copied to clipboard');
      
      // Reset copy status after 2 seconds
      setTimeout(() => {
        setCopyLinkStatus('copy');
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy invite link');
    });
  };

  // Close invite link section
  const closeInviteLink = () => {
    setShowInviteLink(false);
    setInviteLink('');
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
    
        // Fetch members using document IDs directly
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

    return () => unsubscribe();
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
    } catch (error) {
      console.error('Error sending message:', error);
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

  return (
    <div className="mt-20">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="max-w-6xl mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100 h-[calc(100vh-4rem)] flex">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Team Header */}
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-blue-800">{team?.name}</h1>
              </div>
              <Button 
                variant="outline" 
                className="text-blue-600 hover:bg-blue-50"
                onClick={generateInviteLink}
              >
                <UserPlus className="h-5 w-5 mr-2" /> Invite Members
              </Button>
            </div>

            {/* Invite Link Section */}
            {showInviteLink && inviteLink && (
              <div className="p-4 bg-blue-50 flex items-center justify-between relative">
                <div className="flex-1 mr-4">
                  <p className="text-sm text-blue-800 font-medium">Share this invite link with your team</p>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}${inviteLink}`} 
                    className="w-full text-sm bg-white rounded-md p-2 mt-2 truncate"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={copyInviteLink}
                    className="text-blue-600 hover:bg-blue-100"
                  >
                    {copyLinkStatus === 'copy' ? (
                      <Copy className="h-5 w-5 mr-2" />
                    ) : (
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                    )}
                    {copyLinkStatus === 'copy' ? 'Copy Link' : 'Copied!'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeInviteLink}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 group`}>
                    {senderPhoto ? (
                      <img
                        src={senderPhoto}
                        alt={senderName}
                        className="h-8 w-8 rounded-full border-2 border-blue-200 transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">
                          {senderName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl relative ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
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
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 ease-in-out"
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
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Team Members Sidebar */}
        <div className="w-72 border-l bg-gray-50 p-4 overflow-y-auto">
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