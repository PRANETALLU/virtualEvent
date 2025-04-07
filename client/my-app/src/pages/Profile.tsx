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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header/Banner Section */}
          <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

          {/* Profile Content */}
          <div className="relative px-6 pb-6">
            {/* Avatar Section */}
            <div className="relative -mt-16 mb-4 flex justify-center">
              <div className="relative w-32 h-32">
                <img
                  src={userInfo.avatar || defaultAvatar}
                  alt="Profile"
                  className="w-full h-full rounded-full border-4 border-white shadow-lg object-cover"
                />
                {isEditing && (
                  <label className="absolute bottom-0 left-0 right-0 text-center cursor-pointer">
                    <div className="bg-black bg-opacity-50 text-white text-sm py-1 px-2 rounded-b-full hover:bg-opacity-70 transition-all">
                      Change Photo
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* User Info Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{userInfo.username}</h1>
              <p className="text-gray-500">{userInfo.email}</p>
            </div>

            {/* Bio Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                About Me
              </h2>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  {userInfo.bio || "No bio available"}
                </div>
              )}
            </div>

            {/* Interests Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Interests
              </h2>
              {isEditing ? (
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. coding, music, photography (comma-separated)"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userInfo.interests && userInfo.interests.length > 0 ? (
                    userInfo.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full inline-flex items-center"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No interests listed</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                             disabled:opacity-50 transition-all duration-200 flex items-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                             disabled:opacity-50 transition-all duration-200 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                           transition-all duration-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;