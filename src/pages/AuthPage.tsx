import { useState } from 'react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">
          {isLogin ? 'Login' : 'Register'}
        </h1>

        <p className="text-gray-600 mb-6">
          Auth formuláre boli odstránené.
        </p>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-green-600 hover:underline"
        >
          Prepnúť na {isLogin ? 'Register' : 'Login'}
        </button>
      </div>
    </div>
  );
}
