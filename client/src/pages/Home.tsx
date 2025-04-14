import {
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
  IonPage,
  IonRow,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  arrowForward,
  basket,
  heartOutline,
  paw,
  warning
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useAuth } from '../contexts/AuthContext';
import { usePets } from '../contexts/PetContext';
import { useProducts } from '../contexts/ProductContext';
import './Home.css';
// Slide options
const slideOpts = {
  initialSlide: 0,
  speed: 400,
  slidesPerView: 1.1,
  spaceBetween: 10,
  centeredSlides: false
};

const Home: React.FC = () => {
  const { pets, isLoading: petsLoading, fetchPets } = usePets();
  const { products, fetchProducts } = useProducts();
  const { isLoggedIn } = useAuth();
  
  // States for UI animations/interactions
  // const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [recentPets, setRecentPets] = useState<any[]>([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Load data when component mounts
    fetchPets();
    fetchProducts();
  }, [fetchPets,fetchProducts]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Update featured products when products data changes
    if (products && products.length) {
      // setFeaturedProducts(products.filter((p) => p.stock > 0).slice(0, 5));
    }
  }, [products]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Update recent pets when pets data changes
    if (pets && pets.length) {
      setRecentPets(pets.filter((p) => p.status === 'available' || p.status === "pending").slice(0, 5));
    }
  }, [pets]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonTitle>PawfectMatch</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">PawfectMatch</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        {/* Hero Banner */}
        <div className="hero-banner">
          <IonCard className="hero-card">
            <img 
              src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
              alt="Pets" 
            />
            <div className="hero-card-content">
              <h1>Welcome to PawfectMatch</h1>
              <p>Adopt a pet, shop for supplies, and report animal cruelty</p>
              {!isLoggedIn() && (
                <IonButton routerLink="/login" fill="solid" color="light">
                  Join Us
                </IonButton>
              )}
            </div>
          </IonCard>
        </div>

        {/* Quick Links */}
        <IonGrid>
          <IonRow>
            <IonCol size="4">
              <IonButton 
                routerLink="/pets" 
                expand="block" 
                fill="solid" 
                color="petprimary"
                className="quick-link-button"
              >
                <div className="button-inner">
                  <IonIcon icon={paw} />
                  <div>Adopt</div>
                </div>
              </IonButton>
            </IonCol>
            <IonCol size="4">
              <IonButton 
                routerLink="/products" 
                expand="block" 
                fill="solid" 
                color="petsecondary"
                className="quick-link-button"
              >
                <div className="button-inner">
                  <IonIcon icon={basket} />
                  <div>Shop</div>
                </div>
              </IonButton>
            </IonCol>
            <IonCol size="4">
              <IonButton 
                routerLink="/report" 
                expand="block" 
                fill="solid" 
                color="danger"
                className="quick-link-button"
              >
                <div className="button-inner">
                  <IonIcon icon={warning} />
                  <div>Report</div>
                </div>
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Featured Pets */}
        <div className="section-header">
          <h2>Pets Looking for a Home</h2>
          <IonButton routerLink="/pets" fill="clear" color="petprimary">
            View All
            <IonIcon slot="end" icon={arrowForward} />
          </IonButton>
        </div>
        
        {petsLoading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : recentPets.length > 0 ? (
          <Swiper className="pet-slides" {...slideOpts}>
            {recentPets.map((pet) => (
              <SwiperSlide key={pet.id}>
                <IonCard routerLink={`/pets/${pet.id}`} className="pet-card">
                  <div className="card-image-container">
                    {pet.imageUrl ? (
                      <img 
                        src={pet.imageUrl} 
                        alt={pet.name} 
                        className="pet-image"
                      />
                    ) : (
                      <div className="pet-image-placeholder">
                        <IonIcon icon={paw} />
                      </div>
                    )}
                    <IonChip className="pet-badge" color="petprimary">
                      {pet.species}
                    </IonChip>
                  </div>
                  <IonCardHeader>
                    <IonCardTitle>{pet.name}</IonCardTitle>
                    <IonCardSubtitle>
                      {pet.breed || 'Mixed Breed'} • {pet.age ? `${pet.age} years` : 'Age unknown'}
                    </IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="card-footer">
                      <IonButton fill="clear" color="petprimary">
                        View Details
                      </IonButton>
                      <IonIcon icon={heartOutline} className="favorite-icon" />
                    </div>
                  </IonCardContent>
                </IonCard>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="empty-state">
            <IonIcon icon={paw} color="medium" />
            <IonText color="medium">No pets available for adoption right now.</IonText>
          </div>
        )}

        {/* Featured Products */}
        {/* <div className="section-header">
          <h2>Featured Products</h2>
          <IonButton routerLink="/products" fill="clear" color="petprimary">
            View All
            <IonIcon slot="end" icon={arrowForward} />
          </IonButton>
        </div>
        
        {productsLoading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : featuredProducts.length > 0 ? (
          <Swiper className="product-slides" {...slideOpts}>
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <IonCard routerLink={`/products/${product.id}`} className="product-card">
                  <div className="card-image-container">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="product-image"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <IonIcon icon={basket} />
                      </div>
                    )}
                    <IonBadge className="price-badge" color="petsecondary">
                      ${Number(product?.price ?? 0).toFixed(2)}
                    </IonBadge>
                  </div>
                  <IonCardHeader>
                    <IonCardTitle>{product.name}</IonCardTitle>
                    <IonCardSubtitle>{product.category}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="card-footer">
                      <IonButton fill="clear" color="petprimary">
                        View Details
                      </IonButton>
                      <IonButton fill="clear" color="petsecondary">
                        <IonIcon slot="icon-only" icon={cart} />
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="empty-state">
            <IonIcon icon={basket} color="medium" />
            <IonText color="medium">No products available right now.</IonText>
          </div>
        )} */}
        
        {/* Report Cruelty Section */}
        <IonCard className="report-card">
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="8">
                  <h2>Report Animal Cruelty</h2>
                  <p>
                    Help us protect animals by reporting abuse or neglect. Your report can save a life.
                  </p>
                  <IonButton routerLink="/report" color="danger">
                    Report Now
                    <IonIcon slot="end" icon={warning} />
                  </IonButton>
                </IonCol>
                <IonCol size="4" className="report-image-col">
                  <div className="report-image-container">
                    <IonIcon icon={warning} color="danger" />
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;