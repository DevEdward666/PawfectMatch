import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonSlides,
  IonSlide,
  IonImg,
  IonText,
  IonSpinner,
  IonBadge,
  IonChip
} from '@ionic/react';
import { 
  paw, 
  basket, 
  chatbubbleEllipses, 
  warning, 
  heart, 
  heartOutline, 
  cart, 
  arrowForward 
} from 'ionicons/icons';
import { usePets } from '../contexts/PetContext';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';

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
  const { products, isLoading: productsLoading, fetchProducts } = useProducts();
  const { isLoggedIn } = useAuth();
  
  // States for UI animations/interactions
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [recentPets, setRecentPets] = useState<any[]>([]);
  
  useEffect(() => {
    // Load data when component mounts
    fetchPets();
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Update featured products when products data changes
    if (products && products.length) {
      setFeaturedProducts(products.filter((p) => p.stock > 0).slice(0, 5));
    }
  }, [products]);
  
  useEffect(() => {
    // Update recent pets when pets data changes
    if (pets && pets.length) {
      setRecentPets(pets.filter((p) => p.status === 'available').slice(0, 5));
    }
  }, [pets]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonTitle>PetShop</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">PetShop</IonTitle>
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
              <h1>Welcome to PetShop</h1>
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
          <IonSlides options={slideOpts} className="pet-slides">
            {recentPets.map((pet) => (
              <IonSlide key={pet.id}>
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
              </IonSlide>
            ))}
          </IonSlides>
        ) : (
          <div className="empty-state">
            <IonIcon icon={paw} color="medium" />
            <IonText color="medium">No pets available for adoption right now.</IonText>
          </div>
        )}

        {/* Featured Products */}
        <div className="section-header">
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
          <IonSlides options={slideOpts} className="product-slides">
            {featuredProducts.map((product) => (
              <IonSlide key={product.id}>
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
                      ${product.price.toFixed(2)}
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
              </IonSlide>
            ))}
          </IonSlides>
        ) : (
          <div className="empty-state">
            <IonIcon icon={basket} color="medium" />
            <IonText color="medium">No products available right now.</IonText>
          </div>
        )}
        
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
      
      <style jsx>{`
        /* CSS Styles */
        .hero-banner {
          margin-bottom: 20px;
        }
        
        .hero-card {
          position: relative;
          margin: 0;
          width: 100%;
          border-radius: 0;
        }
        
        .hero-card img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          opacity: 0.7;
        }
        
        .hero-card-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          color: white;
        }
        
        .hero-card-content h1 {
          margin-bottom: 8px;
          font-size: 24px;
          font-weight: bold;
        }
        
        .hero-card-content p {
          margin-bottom: 20px;
          font-size: 16px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          margin: 20px 0 10px;
        }
        
        .section-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .pet-card, .product-card {
          width: 100%;
          margin: 0;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .card-image-container {
          position: relative;
          height: 160px;
          overflow: hidden;
        }
        
        .pet-image, .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .pet-image-placeholder, .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f4f4f4;
        }
        
        .pet-image-placeholder ion-icon, .product-image-placeholder ion-icon {
          font-size: 3rem;
          color: #cccccc;
        }
        
        .pet-badge, .price-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          margin: 0;
        }
        
        .pet-slides, .product-slides {
          padding: 10px 0 20px 10px;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .favorite-icon {
          font-size: 24px;
          color: var(--ion-color-medium);
        }
        
        .loading-container, .empty-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
        }
        
        .empty-state ion-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        
        .quick-link-button {
          height: 80px;
          margin: 0;
        }
        
        .button-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .button-inner ion-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .report-card {
          margin: 20px 16px;
          border-radius: 12px;
          background-color: #fff9fc;
        }
        
        .report-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }
        
        .report-image-container ion-icon {
          font-size: 4rem;
        }
        
        .report-image-col {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </IonPage>
  );
};

export default Home;