import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  getDocs,
  doc,
  getDoc 
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Team, Message, User } from '@/types';
import { Send, Users, Info, Clock, UserPlus, Zap } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100 h-[calc(100vh-4rem)] flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Team Header */}
          <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">{team.name}</h1>
              {team.description && (
                <div className="group relative">
                  <p className="text-sm text-blue-600 mt-1 flex items-center cursor-help">
                    <Info className="h-4 w-4 mr-1" />
                    Team Description
                    <span className="hidden group-hover:block absolute z-10 bg-blue-600 text-white text-xs p-2 rounded-md -bottom-10 left-0 shadow-lg">
                      {team.description}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <Button variant="outline" className="text-blue-600 hover:bg-blue-50">
              <UserPlus className="h-5 w-5 mr-2" /> Invite Members
            </Button>
          </div>

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