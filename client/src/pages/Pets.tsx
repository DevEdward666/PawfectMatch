import { RefresherEventDetail } from '@ionic/core';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonLoading,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  female,
  filter,
  heart,
  heartOutline,
  male,
  paw,
  search
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { usePets } from '../contexts/PetContext';
import { Pet } from '../models/pet.model';
import "./Pets.css";
const Pets: React.FC = () => {
  const { pets, isLoading, error, fetchPets } = usePets();
  // const { isLoggedIn } = useAuth();
  
  const [searchText, setSearchText] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Load pets on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPets();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('petFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, [fetchPets]);
  
  // Filter pets when search text or filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pets) {
      let filtered = [...pets];
      
      // Filter by status - only show available pets
      filtered = filtered.filter(pet => pet.status === 'available' || pet.status === 'pending');
      
      // Apply species filter
      if (selectedSpecies) {
        filtered = filtered.filter(pet => 
          pet.species.toLowerCase() === selectedSpecies.toLowerCase()
        );
      }
      
      // Apply search text filter
      if (searchText) {
        filtered = filtered.filter(pet => 
          pet.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (pet.breed && pet.breed.toLowerCase().includes(searchText.toLowerCase())) ||
          pet.species.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      setFilteredPets(filtered);
    }
  }, [pets, searchText, selectedSpecies]);
  
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchPets().then(() => {
      event.detail.complete();
    });
  };
  
  const toggleFavorite = (petId: number) => {
    let newFavorites;
    if (favorites.includes(petId)) {
      newFavorites = favorites.filter(id => id !== petId);
    } else {
      newFavorites = [...favorites, petId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('petFavorites', JSON.stringify(newFavorites));
  };
  
  const resetFilters = () => {
    setSelectedSpecies('');
    setSearchText('');
  };
  
  const getSpeciesColor = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return 'warning';
      case 'cat':
        return 'tertiary';
      case 'bird':
        return 'success';
      case 'fish':
        return 'primary';
      case 'reptile':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'pending':
        return 'warning';
      case 'adopted':
        return 'medium';
      default:
        return 'medium';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Pets for Adoption</IonTitle>
          <IonButton 
            slot="end" 
            fill="clear" 
            color="light"
            onClick={() => setShowFilters(!showFilters)}
          >
            <IonIcon slot="icon-only" icon={filter} />
          </IonButton>
        </IonToolbar>
        
        {showFilters && (
          <IonToolbar>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonSearchbar
                    value={searchText}
                    onIonChange={e => setSearchText(e.detail.value!)}
                    placeholder="Search by name or breed"
                    animated
                    showCancelButton="focus"
                  />
                </IonCol>
                <IonCol size="9">
                  <IonSelect
                    value={selectedSpecies}
                    placeholder="Select Species"
                    onIonChange={e => setSelectedSpecies(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="">All Species</IonSelectOption>
                    <IonSelectOption value="dog">Dogs</IonSelectOption>
                    <IonSelectOption value="cat">Cats</IonSelectOption>
                    <IonSelectOption value="bird">Birds</IonSelectOption>
                    <IonSelectOption value="fish">Fish</IonSelectOption>
                    <IonSelectOption value="reptile">Reptiles</IonSelectOption>
                    <IonSelectOption value="other">Other</IonSelectOption>
                  </IonSelect>
                </IonCol>
                <IonCol size="3">
                  <IonButton 
                    expand="block" 
                    fill="clear" 
                    onClick={resetFilters}
                  >
                    Reset
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonToolbar>
        )}
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        
        {isLoading ? (
          <IonLoading isOpen={true} message="Loading pets..." />
        ) : error ? (
          <div className="error-container">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton onClick={() => fetchPets()}>Try Again</IonButton>
          </div>
        ) : (
          <>
            {/* Summary section */}
            <div className="summary-section">
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <div className="summary-container">
                      <h4 className="summary-title">
                        {filteredPets.length} pets available for adoption
                      </h4>
                      {selectedSpecies && (
                        <IonChip 
                          color={getSpeciesColor(selectedSpecies)}
                          outline
                        >
                          <IonIcon icon={paw} />
                          <IonLabel>{selectedSpecies.charAt(0).toUpperCase() + selectedSpecies.slice(1)}s</IonLabel>
                        </IonChip>
                      )}
                      {searchText && (
                        <IonChip outline>
                          <IonIcon icon={search} />
                          <IonLabel>"{searchText}"</IonLabel>
                        </IonChip>
                      )}
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
            
            {/* Pet grid */}
            <IonGrid>
              <IonRow>
                {filteredPets.length > 0 ? (
                  filteredPets.map(pet => (
                    <IonCol 
                      size="12" 
                      sizeSm="6" 
                      sizeMd="4" 
                      sizeXl="3" 
                      key={pet.id}
                    >
                      <IonCard className="pet-card" routerLink={`/pets/${pet.id}`}>
                        <div className="card-image-container">
                          {pet.imageUrl ? (
                            <img 
                              src={`data:image/jpeg;base64,${pet.imageUrl}`} 
                              alt={pet.name} 
                              className="pet-image"
                            />
                          ) : (
                            <div className="pet-image-placeholder">
                              <IonIcon icon={paw} />
                            </div>
                          )}
                          
                  
                          <IonButton 
                            fill="clear" 
                            className="favorite-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              toggleFavorite(pet.id);
                            }}
                          >
                            <IonIcon 
                              icon={favorites.includes(pet.id) ? heart : heartOutline} 
                              color={favorites.includes(pet.id) ? 'danger' : 'dark'}
                            />
                          </IonButton>
                          
                        </div>
                        
                        <IonCardHeader>
                     
                          
                          <IonCardTitle>{pet.name}</IonCardTitle>
                          <IonCardSubtitle>
                          {pet.species}- {pet.gender} - {pet.breed || 'Mixed Breed'} • {pet.age ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'}` : 'Age unknown'}
                          </IonCardSubtitle>
                        </IonCardHeader>
                        
                        <IonCardContent>
                          <p className="pet-description">
                            {pet.description || `Meet ${pet.name}, a lovely ${pet.species.toLowerCase()} looking for a forever home.`}
                          </p>
                          
                          <div className="card-actions">
                            <IonBadge color={getStatusColor(pet.status)} className="status-badge">
                              {pet.status}
                            </IonBadge>
                            
                            <IonButton fill="solid" color="primary" size="small">
                              View Details
                            </IonButton>
                          </div>
                          
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))
                ) : (
                  <IonCol size="12">
                    <div className="empty-state">
                      <IonIcon icon={paw} color="medium" />
                      <IonText color="medium">
                        <h5>No pets found matching your criteria</h5>
                        <p>Try adjusting your filters or check back later for more pets.</p>
                      </IonText>
                      <IonButton color="primary" onClick={resetFilters}>
                        Reset Filters
                      </IonButton>
                    </div>
                  </IonCol>
                )}
              </IonRow>
            </IonGrid>
          </>
        )}
        
        {/* <IonInfiniteScroll>
          <IonInfiniteScrollContent  loadingText="Loading more pets..."></IonInfiniteScrollContent>
        </IonInfiniteScroll> */}
      </IonContent>
      
    </IonPage>
  );
};

export default Pets;