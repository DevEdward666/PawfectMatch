import {
  IonAlert,
  IonBackButton,
  IonBadge,
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
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonPage,
  IonRow,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar
} from '@ionic/react';
import {
  calendar,
  checkmarkCircle,
  clipboard,
  close,
  female,
  heart,
  heartOutline,
  home,
  male,
  paw,
  shareOutline
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { usePets } from '../contexts/PetContext';
import { AdoptionApplicationForm } from '../models/pet.model';
import "./PetDetail.css";
interface PetDetailParams {
  id: string;
}

const PetDetail: React.FC = () => {
  const { id } = useParams<PetDetailParams>();
  const { pet, isLoading, error, fetchPetById, applyForAdoption } = usePets();
  const { isLoggedIn } = useAuth();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState<AdoptionApplicationForm>({
    message: ''
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  
  // Load pet details when component mounts or id changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (id) {
      fetchPetById(parseInt(id));
    }
    
    // Check if pet is in favorites
    const savedFavorites = localStorage.getItem('petFavorites');
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      setIsFavorite(favorites.includes(parseInt(id)));
    }
  }, [id,fetchPetById]);
  
  const toggleFavorite = () => {
    const newIsFavorite = !isFavorite;
    setIsFavorite(newIsFavorite);
    
    // Update localStorage
    const savedFavorites = localStorage.getItem('petFavorites');
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    if (newIsFavorite) {
      if (!favorites.includes(parseInt(id))) {
        favorites.push(parseInt(id));
      }
    } else {
      favorites = favorites.filter((petId: number) => petId !== parseInt(id));
    }
    
    localStorage.setItem('petFavorites', JSON.stringify(favorites));
  };
  
  const handleAdoptClick = () => {
    if (!isLoggedIn()) {
      setShowLoginAlert(true);
    } else {
      setShowAdoptModal(true);
    }
  };
  
  const handleApplicationChange = (e: CustomEvent) => {
    const { value } = e.detail;
    setApplicationForm({
      message: value
    });
  };
  
  const handleSubmitApplication = async () => {
    if (id && applicationForm.message) {
      await applyForAdoption(parseInt(id), applicationForm);
      setShowAdoptModal(false);
      setApplicationForm({ message: '' });
      setShowSuccessToast(true);
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${pet?.name} - Pet Adoption`,
        text: `Check out ${pet?.name}, a ${pet?.species} available for adoption!`,
        url: window.location.href
      }).catch(err => {
        console.error('Could not share:', err);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy link:', err);
        });
    }
  };
  
  if (isLoading) {
    return <IonLoading isOpen={true} message="Loading pet details..." />;
  }
  
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/pets" />
            </IonButtons>
            <IonTitle>Pet Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonText color="danger">
              <h5>Error loading pet details</h5>
              <p>{error}</p>
            </IonText>
            <IonButton onClick={() => fetchPetById(parseInt(id))}>
              Try Again
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
  if (!pet) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/pets" />
            </IonButtons>
            <IonTitle>Pet Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonText color="medium">
              <h5>Pet not found</h5>
              <p>The pet you're looking for doesn't exist or has been removed.</p>
            </IonText>
            <IonButton routerLink="/pets" color="petprimary">
              Back to Pets
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/pets" />
          </IonButtons>
          <IonTitle>{pet.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleShare}>
              <IonIcon slot="icon-only" icon={shareOutline} />
            </IonButton>
            <IonButton onClick={toggleFavorite}>
              <IonIcon 
                slot="icon-only" 
                icon={isFavorite ? heart : heartOutline}
                color={isFavorite ? 'danger' : 'light'}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="pet-image-container">
          {pet.imageUrl ? (
            <img 
              src={pet.imageUrl} 
              alt={pet.name} 
              className="pet-detail-image"
            />
          ) : (
            <div className="pet-image-placeholder">
              <IonIcon icon={paw} />
            </div>
          )}
          
          <div className="image-overlay">
            <div className="badge-container">
              <IonBadge color={getStatusColor(pet.status)} className="status-badge">
                {pet.status}
              </IonBadge>
            </div>
          </div>
        </div>
        
        <div className="pet-content-container">
          <div className="pet-header">
            <div className="pet-title">
              <h1>{pet.name}</h1>
              <div className="pet-subtitle">
                <IonChip color={getSpeciesColor(pet.species)}>
                  <IonIcon icon={paw} />
                  <IonLabel>{pet.species}</IonLabel>
                </IonChip>
                
                {pet.gender && (
                  <IonChip color="medium">
                    <IonIcon icon={pet.gender.toLowerCase() === 'male' ? male : female} />
                    <IonLabel>{pet.gender}</IonLabel>
                  </IonChip>
                )}
                
                {pet.age && (
                  <IonChip color="primary">
                    <IonIcon icon={calendar} />
                    <IonLabel>{pet.age} {pet.age === 1 ? 'year' : 'years'}</IonLabel>
                  </IonChip>
                )}
              </div>
            </div>
            
            <div className="adoption-button-container">
              <IonButton 
                color="petprimary" 
                disabled={pet.status !== 'available'}
                onClick={handleAdoptClick}
              >
                <IonIcon slot="start" icon={home} />
                {pet.status === 'available' ? 'Adopt Me' : 'Not Available'}
              </IonButton>
            </div>
          </div>
          
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>About {pet.name}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="pet-description">
                {pet.description || `Meet ${pet.name}, a lovely ${pet.species.toLowerCase()} looking for a forever home.`}
              </p>
              
              <IonGrid className="pet-details-grid">
                <IonRow>
                  <IonCol size="6">
                    <div className="detail-item">
                      <div className="detail-label">Breed</div>
                      <div className="detail-value">{pet.breed || 'Mixed Breed'}</div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div className="detail-item">
                      <div className="detail-label">Age</div>
                      <div className="detail-value">{pet.age ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'}` : 'Unknown'}</div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div className="detail-item">
                      <div className="detail-label">Gender</div>
                      <div className="detail-value">{pet.gender || 'Unknown'}</div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div className="detail-item">
                      <div className="detail-label">Status</div>
                      <div className="detail-value status-value">
                        <IonBadge color={getStatusColor(pet.status)}>
                          {pet.status}
                        </IonBadge>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
          
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Adoption Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>
                If you're interested in adopting {pet.name}, please submit an adoption application. Our team will review your application and get back to you within 48 hours.
              </p>
              
              <IonList lines="none">
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Application review within 48 hours</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Meet and greet arranged if approved</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Adoption fee includes vaccinations and microchip</IonLabel>
                </IonItem>
              </IonList>
              
              <div className="adoption-button-container-footer">
                <IonButton 
                  expand="block" 
                  color="petprimary" 
                  disabled={pet.status !== 'available' && pet.status !== 'pending'}
                  onClick={handleAdoptClick}
                >
                  <IonIcon slot="start" icon={clipboard} />
                  {pet.status === 'available' || pet.status === 'pending' ? 'Submit Adoption Application' : 'Not Available for Adoption'}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
        
        {/* Adoption Modal */}
        <IonModal isOpen={showAdoptModal} onDidDismiss={() => setShowAdoptModal(false)}>
          <IonHeader>
            <IonToolbar color="petprimary">
              <IonTitle>Adopt {pet.name}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAdoptModal(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="adoption-form">
              <h2>Adoption Application</h2>
              <p>
                Please tell us why you'd like to adopt {pet.name} and a bit about your living situation, experience with pets, and any other relevant information.
              </p>
              
              <IonItem>
                <IonLabel position="stacked">Your Message*</IonLabel>
                <IonTextarea 
                  placeholder="Tell us why you'd like to adopt this pet..." 
                  value={applicationForm.message}
                  onIonChange={handleApplicationChange}
                  rows={6}
                  required
                ></IonTextarea>
              </IonItem>
              
              <div className="adoption-form-buttons">
                <IonButton 
                  expand="block" 
                  color="petprimary"
                  onClick={handleSubmitApplication}
                  disabled={!applicationForm.message}
                >
                  Submit Application
                </IonButton>
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  color="medium"
                  onClick={() => setShowAdoptModal(false)}
                >
                  Cancel
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
        
        {/* Login Alert */}
        <IonAlert
          isOpen={showLoginAlert}
          onDidDismiss={() => setShowLoginAlert(false)}
          header="Sign In Required"
          message="You need to sign in to apply for adoption."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Sign In',
              handler: () => {
                window.location.href = '/login';
              }
            }
          ]}
        />
        
        {/* Success Toast */}
        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message="Your adoption application has been submitted successfully!"
          duration={3000}
          position="bottom"
          color="success"
        />
      </IonContent>
      
    </IonPage>
  );
};

export default PetDetail;