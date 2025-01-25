import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Team, Message, User } from '@/types';
import { Send, Users } from 'lucide-react';

export default function TeamChat() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
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

        const usersRef = collection(db, 'users');
        const membersQuery = query(usersRef, where('uid', 'in', teamData.members || []));
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map(doc => ({
          uid: doc.id,
          displayName: '',
          photoURL: '',
          experience: '',
          ...doc.data()
        })) as User[]; // Fixed to use proper type casting for User
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
      })) as Message[]; // Fixed to use proper type casting for Message
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

  if (!team) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md h-[calc(100vh-8rem)] flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Team Header */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-sm text-gray-500 mt-1">{team.description}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user?.uid;
              const senderName = message.senderName || 'Anonymous';
              const senderPhoto = message.senderPhoto || '';

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                    {senderPhoto ? (
                      <img
                        src={senderPhoto}
                        alt={senderName}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {senderName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Team Members Sidebar */}
        <div className="w-64 border-l p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members
          </h2>
          <div className="space-y-3">
            {members && members.length > 0 ? (
              members.map((member) => {
                const displayName = member.displayName || 'Anonymous';
                const photoURL = member.photoURL || '';
                const experience = member.experience || 'Unknown';
                const initialLetter = displayName ? displayName.charAt(0) : '?';

                return (
                  <div key={member.uid} className="flex items-center space-x-2">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt={displayName}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {initialLetter}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {experience} Developer
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">No team members found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
