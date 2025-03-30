import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import defaultAvatar from "./default.jpg";

const Profile: React.FC = () => {
  const { userInfo, setUserInfo } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState(userInfo?.bio || "");
  const [interests, setInterests] = useState(userInfo?.interests?.join(", ") || "");
  const [avatar, setAvatar] = useState<File | null>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      if (avatar) {
        formData.append("avatar", avatar);
      }
      formData.append("bio", bio);
      formData.append("interests", interests);

      const { data } = await axios.put(
        `http://localhost:5000/user/${userInfo?.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUserInfo((prev) => ({
        ...prev,
        bio: data.bio,
        interests: data.interests,
        avatar: data.avatar,
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setBio(userInfo?.bio || "");
    setInterests(userInfo?.interests?.join(", ") || "");
    setAvatar(null);
    setError(null);
    setIsEditing(false);
  };

  if (!userInfo) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Rest of your JSX remains the same, but update the Cancel button onClick */}
        <div className="mt-6 flex justify-end">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;