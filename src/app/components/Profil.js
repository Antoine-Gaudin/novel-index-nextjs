"use client";

const Profil = ({ user }) => {
  return (
    <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Profil de l'utilisateur</h1>
      <div className="text-sm mb-4">
        <p><strong>Nom d'utilisateur :</strong> {user.username}</p>
        <p><strong>Email :</strong> {user.email}</p>
      </div>
    </div>
  );
};

export default Profil;
