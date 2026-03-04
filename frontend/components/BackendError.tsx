import React from 'react';

export default function BackendError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Connexion au serveur impossible</h2>
        <p className="text-gray-600 mb-6">Le backend n'est pas disponible pour le moment. Vérifiez que le serveur est démarré et réessayez.</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700"
          >
            Réessayer
          </button>
          {onRetry && (
            <button onClick={onRetry} className="px-4 py-2 border rounded-lg">Action</button>
          )}
        </div>
      </div>
    </div>
  );
}

