import React, { createContext, useState, ReactNode } from "react";

// Define the User interface with expected properties
interface User {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  // Add other user properties as needed
}

// Define the context type with proper typing
interface UserContextType {
  userInfo: User | null;  // Allow null value
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;  // Set state type to User | null
}

// Create the context with an initial undefined value
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Define props interface for the provider component
interface UserContextProviderProps {
  children: ReactNode;
}

// Create the provider component with proper typing
const UserContextProvider = ({ children }: UserContextProviderProps) => {
  const [userInfo, setUserInfo] = useState<User | null>(null); // Initialize userInfo as null

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

// Add a custom hook for using the context
export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserContextProvider");
  }
  return context;
};

export default UserContextProvider;
