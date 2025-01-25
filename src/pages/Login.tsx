import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          skills: [],
          availability: [],
          experience: 'beginner',
          interests: [],
          bio: '',
          createdAt: new Date().toISOString()
        });
      }

      navigate('/profile');
    } catch (err) {
      setError('Failed to sign in with Google');
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to TeamUp</h2>
          <p className="mt-2 text-gray-600">
            Find your perfect hackathon team today
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}