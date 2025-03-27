import React from "react";
import { useUser } from "../context/UserContext";

const Profile: React.FC = () => {
  const { userInfo } = useUser();

  if (!userInfo) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center p-6">
      <div className="w-full flex justify-end">
        <div className="w-24 h-24">
          <img
            src={userInfo.avatar || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-full h-full rounded-full shadow-md object-cover"
          />
        </div>
      </div>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-semibold">Name</h2>
        <h1 className="text-gray-600">{userInfo.username}</h1>
      </div>
      <div className="mt-2 text-center">
        <h2 className="text-xl font-semibold">Email</h2>
        <p className="text-gray-600">{userInfo.email}</p>
      </div>
      <p className="mt-2 text-center">{userInfo.bio || "No bio available"}</p>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Interests</h2>
        <ul className="list-disc list-inside">
          {userInfo.interests && userInfo.interests.length > 0 ? (
            userInfo.interests.map((interest, index) => <li key={index}>{interest}</li>)
          ) : (
            <p>No interests listed</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Profile;