import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
  useIonToast
} from '@ionic/react';
import {
  add,
  closeOutline,
  create,
  ellipsisVertical,
  eyeOutline,
  filterOutline,
  paw,
  refreshOutline,
  trash
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { usePets } from '../../contexts/PetContext';
import { usePhotoGallery } from '../../hooks/usePhotoGallery';
import { Pet, PetForm } from '../../models/pet.model';
import './PetManagement.css';
const PetManagement: React.FC = () => {
  const {
    pets,
    adoptionApplications,
    isLoading,
    fetchPets,
    createPet,
    updatePet,
    deletePet,
    fetchAllAdoptionApplications,
    updateAdoptionApplication
  } = usePets();
  
  const [present] = useIonActionSheet();
  const [presentToast] = useIonToast();
  
  // State variables
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentPet, setCurrentPet] = useState<Pet | null>(null);
  const [showAdoptionApplications, setShowAdoptionApplications] = useState<boolean>(false);
  
  // Form state
  const [formData, setFormData] = useState<PetForm>({
    name: '',
    species: '',
    breed: '',
    age: undefined,
    gender: '',
    description: '',
    status: 'available',
    image:undefined
  });
  
  const { photos, takePhoto } = usePhotoGallery();
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  
  // Effects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  const initialize = async () => {
    await fetchPets();
    await fetchAllAdoptionApplications();
  }
  initialize();
  }, [fetchPets,fetchAllAdoptionApplications]);
  
  // Functions
  const loadPets = async () => {
    await fetchPets();
  };
  
  const loadAdoptionApplications = async () => {
    await fetchAllAdoptionApplications();
  };
  
  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value!);
  };
  
  // const handleViewChange = (e: CustomEvent) => {
  //   setActiveView(e.detail.value);
  // };
  
  const resetForm = () => {
    setFormData({
      name: '',
      species: '',
      breed: '',
      age: undefined,
      gender: '',
      description: '',
      status: 'available',
      image:undefined
    });
    setPhotoPreview(undefined);
    // deletePhotos();
  };
  
  const openAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };
  
  const openEditModal = (pet: Pet) => {
    setCurrentPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age,
      gender: pet.gender || '',
      description: pet.description || '',
      status: pet.status,
    });
    setPhotoPreview(pet.imageUrl);
    setIsEditMode(true);
    setIsModalOpen(true);
  };
  
  const handleInputChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleTakePhoto = async () => {
    try {
      await takePhoto();
      if (photos.length > 0) {
        setPhotoPreview(photos[0].webviewPath);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };
  
  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.species) {
        presentToast({
          message: 'Name and species are required',
          duration: 3000,
          color: 'danger'
        });
        return;
      }
      
      // Create image file if available
      let imageFile: File | undefined;
      if (photos.length > 0) {
        const response = await fetch(photos[0].webviewPath!);
        const blob = await response.blob();
        imageFile = new File([blob], 'pet-image.jpg', { type: 'image/jpeg' });
      }
      
      // Update or create
      if (isEditMode && currentPet) {
        await updatePet(currentPet.id, {
          ...formData,
          image: imageFile
        });
        presentToast({
          message: 'Pet updated successfully',
          duration: 3000,
          color: 'success'
        });
      } else {
        await createPet({
          ...formData,
          image: imageFile
        });
        presentToast({
          message: 'Pet added successfully',
          duration: 3000,
          color: 'success'
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      loadPets();
    } catch (error) {
      console.error('Error submitting form:', error);
      presentToast({
        message: 'Error processing your request',
        duration: 3000,
        color: 'danger'
      });
    }
  };
  
  const confirmDelete = (pet: Pet) => {
    setPetToDelete(pet);
    setShowDeleteAlert(true);
  };
  
  const handleDelete = async () => {
    if (petToDelete) {
      try {
        await deletePet(petToDelete.id);
        presentToast({
          message: 'Pet deleted successfully',
          duration: 3000,
          color: 'success'
        });
        loadPets();
      } catch (error) {
        console.error('Error deleting pet:', error);
        presentToast({
          message: 'Error deleting pet',
          duration: 3000,
          color: 'danger'
        });
      }
    }
    setShowDeleteAlert(false);
    setPetToDelete(null);
  };
  
  const handleShowApplications = (pet: Pet) => {
    setCurrentPet(pet);
    setShowAdoptionApplications(true);
  };
  
  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      await updateAdoptionApplication(applicationId, status);
      loadAdoptionApplications();
      presentToast({
        message: 'Application status updated',
        duration: 3000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      presentToast({
        message: 'Error updating status',
        duration: 3000,
        color: 'danger'
      });
    }
  };
  
  const showOptions = (pet: Pet) => {
    present({
      header: 'Actions',
      buttons: [
        {
          text: 'View Details',
          icon: eyeOutline,
          handler: () => openEditModal(pet)
        },
        {
          text: 'Edit',
          icon: create,
          handler: () => openEditModal(pet)
        },
        {
          text: 'View Adoption Requests',
          icon: paw,
          handler: () => handleShowApplications(pet)
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: trash,
          handler: () => confirmDelete(pet)
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };
  
  // Filtering pets
  const filteredPets = pets
    .filter(pet => {
      console.log(pet)
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          pet.name.toLowerCase().includes(searchLower) ||
          pet.species.toLowerCase().includes(searchLower) ||
          pet.breed?.toLowerCase().includes(searchLower) ||
          pet.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(pet => {
      // Status filter
      if (statusFilter !== 'all') {
        return pet.status === statusFilter;
      }
      return true;
    })
    .filter(pet => {
      // Species filter
      if (speciesFilter !== 'all') {
        return pet.species.toLowerCase() === speciesFilter.toLowerCase();
      }
      return true;
    });
    
  // Get unique species for filter
  const uniqueSpecies = Array.from(new Set(pets.map(pet => pet.species)));
    
  // Pet applications for current pet
  const petApplications = adoptionApplications?.filter(app => 
    currentPet && app.petId === currentPet.id
  );
  
  return (
    <div className="ion-padding">
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="ion-padding-bottom">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Pet Management</div>
                    <div>
                      <IonButton fill="clear" onClick={() => setShowFilter(!showFilter)}>
                        <IonIcon icon={filterOutline} />
                      </IonButton>
                      <IonButton fill="clear" onClick={loadPets}>
                        <IonIcon icon={refreshOutline} />
                      </IonButton>
                      <IonButton onClick={openAddModal}>
                        <IonIcon icon={add} /> Add Pet
                      </IonButton>
                    </div>
                  </div>
                </IonCardTitle>
              </IonCardHeader>
              
              <IonCardContent>
                {/* Filters */}
                {showFilter && (
                  <div className="ion-padding-bottom">
                    <IonGrid>
                      <IonRow>
                        <IonCol size="12" sizeMd="4">
                          <IonSearchbar
                            value={searchText}
                            onIonChange={handleSearch}
                            placeholder="Search pets"
                          />
                        </IonCol>
                        
                        <IonCol size="6" sizeMd="4">
                          <IonItem>
                            <IonLabel>Status</IonLabel>
                            <IonSelect 
                              value={statusFilter} 
                              onIonChange={e => setStatusFilter(e.detail.value)}
                            >
                              <IonSelectOption value="all">All</IonSelectOption>
                              <IonSelectOption value="available">Available</IonSelectOption>
                              <IonSelectOption value="adopted">Adopted</IonSelectOption>
                              <IonSelectOption value="pending">Pending</IonSelectOption>
                            </IonSelect>
                          </IonItem>
                        </IonCol>
                        
                        <IonCol size="6" sizeMd="4">
                          <IonItem>
                            <IonLabel>Species</IonLabel>
                            <IonSelect 
                              value={speciesFilter} 
                              onIonChange={e => setSpeciesFilter(e.detail.value)}
                            >
                              <IonSelectOption value="all">All</IonSelectOption>
                              {uniqueSpecies.map((species, index) => (
                                <IonSelectOption key={index} value={species}>
                                  {species}
                                </IonSelectOption>
                              ))}
                            </IonSelect>
                          </IonItem>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </div>
                )}
                
                {isLoading && (
                  <div className="ion-text-center ion-padding">
                    <IonSpinner />
                    <p>Loading pets...</p>
                  </div>
                )}
                
                {!isLoading && filteredPets.length === 0 && (
                  <div className="ion-text-center ion-padding">
                    <IonText color="medium">
                      <p>No pets found. Try adjusting your filters or add a new pet.</p>
                    </IonText>
                    <IonButton onClick={openAddModal}>
                      <IonIcon icon={add} slot="start" /> Add New Pet
                    </IonButton>
                  </div>
                )}
                
                {!isLoading && filteredPets.length > 0 && (
                  <IonList>
                    {filteredPets.map(pet => (
                      <IonItem key={pet.id} className="ion-margin-bottom">
                        {pet.imageUrl && (
                          <IonAvatar slot="start">
                            <img src={pet.imageUrl} alt={pet.name} />
                          </IonAvatar>
                        )}
                        {!pet.imageUrl && (
                          <IonAvatar slot="start">
                            <div style={{ 
                              backgroundColor: '#f0f0f0', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              width: '100%',
                              height: '100%'
                            }}>
                              <IonIcon icon={paw} />
                            </div>
                          </IonAvatar>
                        )}
                        
                        <IonLabel>
                          <h2>{pet.name}</h2>
                          <p>{pet.species} {pet.breed ? `- ${pet.breed}` : ''}</p>
                          <p>{pet.age ? `${pet.age} years old` : ''} {pet.gender ? `- ${pet.gender}` : ''}</p>
                        </IonLabel>
                        
                        <IonChip 
                          color={
                            pet.status === 'available' 
                              ? 'success' 
                              : pet.status === 'pending' 
                                ? 'warning' 
                                : 'primary'
                          }
                        >
                          {pet.status}
                        </IonChip>
                        
                        <IonButton fill="clear" slot="end" onClick={() => showOptions(pet)}>
                          <IonIcon icon={ellipsisVertical} />
                        </IonButton>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
      
      {/* Add/Edit Pet Modal */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{isEditMode ? 'Edit Pet' : 'Add New Pet'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsModalOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <IonItem>
              <IonLabel position="stacked">Name *</IonLabel>
              <IonInput
                value={formData.name}
                onIonChange={e => handleInputChange('name', e.detail.value!)}
                placeholder="Enter pet name"
                required
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Species *</IonLabel>
              <IonInput
                value={formData.species}
                onIonChange={e => handleInputChange('species', e.detail.value!)}
                placeholder="e.g. Dog, Cat, Bird, etc."
                required
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Breed</IonLabel>
              <IonInput
                value={formData.breed}
                onIonChange={e => handleInputChange('breed', e.detail.value!)}
                placeholder="e.g. Labrador, Persian, etc."
              />
            </IonItem>
            
            <IonRow>
              <IonCol size="6">
                <IonItem>
                  <IonLabel position="stacked">Age (years)</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.age}
                    onIonChange={e => handleInputChange('age', e.detail.value ? parseInt(e.detail.value, 10) : undefined)}
                    placeholder="Age in years"
                  />
                </IonItem>
              </IonCol>
              
              <IonCol size="6">
                <IonItem>
                  <IonLabel position="stacked">Gender</IonLabel>
                  <IonSelect
                    value={formData.gender}
                    onIonChange={e => handleInputChange('gender', e.detail.value)}
                  >
                    <IonSelectOption value="">Not specified</IonSelectOption>
                    <IonSelectOption value="Male">Male</IonSelectOption>
                    <IonSelectOption value="Female">Female</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>
            
            <IonItem>
              <IonLabel position="stacked">Status</IonLabel>
              <IonSelect
                value={formData.status}
                onIonChange={e => handleInputChange('status', e.detail.value)}
              >
                <IonSelectOption value="available">Available</IonSelectOption>
                <IonSelectOption value="pending">Pending</IonSelectOption>
                <IonSelectOption value="adopted">Adopted</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={e => handleInputChange('description', e.detail.value!)}
                placeholder="Describe the pet... personality, requirements, etc."
                rows={4}
              />
            </IonItem>
            
            <div className="ion-padding">
              <IonLabel>Pet Photo</IonLabel>
              <div style={{ marginTop: '10px', marginBottom: '20px' }}>
                {photoPreview ? (
                  <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                    <img 
                      src={photoPreview} 
                      alt="Pet" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '10px'
                      }} 
                    />
                    <IonButton
                      fill="clear"
                      style={{ 
                        position: 'absolute', 
                        top: '-10px', 
                        right: '-10px',
                        '--padding-start': '0',
                        '--padding-end': '0'
                      }}
                      onClick={() => {
                        setPhotoPreview(undefined);
                        // deletePhotos();
                      }}
                    >
                      <IonIcon icon={closeOutline} />
                    </IonButton>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      width: '200px', 
                      height: '200px', 
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '10px'
                    }}
                  >
                    <IonIcon icon={paw} size="large" color="medium" />
                  </div>
                )}
              </div>
              
              <IonButton onClick={handleTakePhoto} expand="block">
                {photoPreview ? 'Replace Photo' : 'Take Photo'}
              </IonButton>
            </div>
            
            <div className="ion-padding ion-text-center">
              <IonButton expand="block" type="submit">
                {isEditMode ? 'Update Pet' : 'Add Pet'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
      
      {/* View Adoption Applications Modal */}
      <IonModal isOpen={showAdoptionApplications} onDidDismiss={() => setShowAdoptionApplications(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {currentPet ? `Adoption Requests for ${currentPet.name}` : 'Adoption Requests'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAdoptionApplications(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          {isLoading && (
            <div className="ion-text-center ion-padding">
              <IonSpinner />
              <p>Loading applications...</p>
            </div>
          )}
          
          {!isLoading && petApplications?.length === 0 && (
            <div className="ion-text-center ion-padding">
              <IonText color="medium">
                <h4>No adoption applications found for this pet</h4>
                <p>There are currently no adoption requests for {currentPet?.name}</p>
              </IonText>
            </div>
          )}
          
          {!isLoading && petApplications?.length > 0 && (
            <IonList>
              {petApplications.map(app => (
                <IonItem key={app.id} className="ion-margin-bottom">
                  <IonLabel>
                    <h2>Applicant ID: {app.userId}</h2>
                    <p className="ion-margin-top">
                      <strong>Status:</strong> <strong className={`statusStyle-${app.status}`}>{app.status.toUpperCase()}</strong>
                    </p>
                    <p className="ion-margin-top">
                      <strong>Message:</strong><br />
                      {app.message || 'No message provided'}
                    </p>
                    <p className="ion-margin-top ion-text-end">
                      <small>
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </small>
                    </p>
                  </IonLabel>
                  
                  <div slot="end">
                    {app.status === 'approved' || app.status === 'rejected' ? null : <>
                      <IonButton
                      
                      color="success"
                      size="small"
                      fill={app.status === 'approved' ? 'solid' : 'outline'}
                      onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                      disabled={app.status === 'approved' || app.status === 'rejected'}
                    >
                      Approve
                    </IonButton>
                    <IonButton
                      color="danger"
                      size="small"
                      fill={app.status === 'rejected' ? 'solid' : 'outline'}
                      onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                      disabled={app.status === 'approved' || app.status === 'rejected'}
                    >
                      Reject
                    </IonButton></>}
          
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonContent>
      </IonModal>
      
      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message={`Are you sure you want to delete ${petToDelete?.name}? This action cannot be undone.`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: handleDelete
          }
        ]}
      />
    </div>
  );
};

export default PetManagement;