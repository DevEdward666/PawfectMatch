import { useIonToast } from "@ionic/react";
import { User } from "models/user.model";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import api from "services/api";

interface UserContextProps {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [present] = useIonToast();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      present({
        message,
        duration: 3000,
        position: 'bottom',
        color: type === 'success' ? 'success' : 'danger'
      });
    },
    [present]
  );

  const getUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile');
      const fetchedUser = response?.data?.data;
      setUser(fetchedUser);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Get Profile failed. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    getUserProfile();
  }, [getUserProfile]);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshUser: getUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
