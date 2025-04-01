import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Pet, PetForm, AdoptionApplication, AdoptionApplicationForm } from '../models/pet.model';
import api from '../services/api';
import { useIonToast } from '@ionic/react';

interface PetContextProps {
  pets: Pet[];
  pet: Pet | null;
  adoptionApplications: AdoptionApplication[];
  isLoading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  fetchPetById: (id: number) => Promise<void>;
  createPet: (petData: PetForm) => Promise<void>;
  updatePet: (id: number, petData: PetForm) => Promise<void>;
  deletePet: (id: number) => Promise<void>;
  applyForAdoption: (petId: number, applicationData: AdoptionApplicationForm) => Promise<void>;
  fetchUserAdoptionApplications: (userId:number) => Promise<void>;
  fetchAllAdoptionApplications: () => Promise<void>;
  updateAdoptionApplication: (id: number, status: string) => Promise<void>;
}

const PetContext = createContext<PetContextProps | undefined>(undefined);

export const PetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [adoptionApplications, setAdoptionApplications] = useState<AdoptionApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [present] = useIonToast();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    present({
      message,
      duration: 3000,
      position: 'bottom',
      color: type === 'success' ? 'success' : 'danger'
    });
  };

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/pets');
      setPets(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pets.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPetById = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/pets/${id}`);
      setPet(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pet details.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const createPet = async (petData: PetForm) => {
    try {
      setIsLoading(true);
      setError(null);
  
      const formData = new FormData();
      Object.entries(petData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "image" && value instanceof File) {
            formData.append("image", value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
  
      console.log("Sending formData:", Object.fromEntries(formData.entries())); // Debugging
  
      const response = await api.post("/pets/addPets", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      setPets([response.data.data, ...pets]);
      showToast("Pet added successfully");
    } catch (err: any) {
      console.error("Error response:", err.response);
      const errorMessage = err.response?.data?.message || "Failed to create pet.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };
  

  const updatePet = async (id: number, petData: PetForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      Object.entries(petData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await api.put(`/pets/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPets(pets.map(p => p.id === id ? response.data.data : p));
      setPet(response.data.data);
      showToast('Pet updated successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update pet.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePet = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.delete(`/pets/${id}`);
      
      setPets(pets.filter(p => p.id !== id));
      if (pet && pet.id === id) {
        setPet(null);
      }
      showToast('Pet deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete pet.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyForAdoption = async (petId: number, applicationData: AdoptionApplicationForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post(`/pets/${petId}/adopt`, applicationData);
      
      showToast('Adoption application submitted successfully');
      
      // Update pet status if needed
      if (pet && pet.id === petId) {
        setPet({ ...pet, status: 'pending' });
      }
      
      // Update in pets list if needed
      setPets(pets.map(p => p.id === petId ? { ...p, status: 'pending' } : p));
      
      // Add to applications list
      setAdoptionApplications([response.data.data, ...adoptionApplications]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit adoption application.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAdoptionApplications = async (userId:number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/adoptions/user/${userId}`);
      setAdoptionApplications(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch your adoption applications.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllAdoptionApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/adoptions/all');
      setAdoptionApplications(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch adoption applications.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdoptionApplication = async (id: number, status: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.put(`/adoptions/${id}`, { status });
      
      // Update in adoption applications list
      setAdoptionApplications(adoptionApplications.map(app => 
        app.id === id ? { ...app, status } : app
      ));
      
      // If the application's pet is the current pet, update its status
      if (response.data.data.pet && pet && pet.id === response.data.data.pet.id) {
        setPet({ ...pet, status: status === 'approved' ? 'adopted' : status === 'rejected' ? 'available' : 'pending' });
      }
      
      // Update in pets list if needed
      if (response.data.data.pet) {
        setPets(pets.map(p => 
          p.id === response.data.data.pet.id 
            ? { ...p, status: status === 'approved' ? 'adopted' : status === 'rejected' ? 'available' : 'pending' } 
            : p
        ));
      }
      
      showToast(`Adoption application ${status} successfully`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update adoption application.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PetContext.Provider
      value={{
        pets,
        pet,
        adoptionApplications,
        isLoading,
        error,
        fetchPets,
        fetchPetById,
        createPet,
        updatePet,
        deletePet,
        applyForAdoption,
        fetchUserAdoptionApplications,
        fetchAllAdoptionApplications,
        updateAdoptionApplication
      }}
    >
      {children}
    </PetContext.Provider>
  );
};

export const usePets = (): PetContextProps => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePets must be used within a PetProvider');
  }
  return context;
};