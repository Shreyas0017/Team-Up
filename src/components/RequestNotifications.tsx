import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from './ui/Button';
import { TeamRequest } from '@/types';

export default function RequestNotifications() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    const requestsRef = collection(db, 'teamRequests');
    const q = query(
      requestsRef,
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeamRequest));
      setRequests(newRequests);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const requestRef = doc(db, 'teamRequests', requestId);
      await updateDoc(requestRef, { status });
      setShowDropdown(false);
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {requests.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {requests.length}
          </span>
        )}
      </Button>

      {showDropdown && requests.length > 0 && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50">
          {requests.map((request) => (
            <div key={request.id} className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center space-x-3 mb-2">
                {request.senderPhoto ? (
                  <img
                    src={request.senderPhoto}
                    alt={request.senderName}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {request.senderName[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{request.senderName}</p>
                  <p className="text-sm text-gray-500">wants to connect</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleRequest(request.id, 'accepted')}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRequest(request.id, 'rejected')}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}