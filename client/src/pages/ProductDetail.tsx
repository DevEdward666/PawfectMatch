import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonText,
  IonLoading,
  IonAlert,
  IonChip,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonItem,
  IonInput,
  IonThumbnail,
  IonList,
  IonAvatar
} from '@ionic/react';
import {
  basket,
  cart,
  star,
  starOutline,
  share,
  shareOutline,
  arrowBack,
  remove,
  add,
  close,
  informationCircle,
  pricetag
} from 'ionicons/icons';
import { useParams } from 'react-router';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';

interface ProductDetailParams {
  id: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<ProductDetailParams>();
  const { product, isLoading, error, fetchProductById } = useProducts();
  const { isLoggedIn } = useAuth();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(false);
  
  // Related products (would normally fetch from API based on category/tags)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  // Load product details when component mounts or id changes
  useEffect(() => {
    if (id) {
      fetchProductById(parseInt(id));
    }
    
    // Check if product is in favorites
    const savedFavorites = localStorage.getItem('productFavorites');
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      setIsFavorite(favorites.includes(parseInt(id)));
    }
  }, [id]);
  
  // Reset quantity to 1 when product changes
  useEffect(() => {
    setQuantity(1);
  }, [product]);
  
  const toggleFavorite = () => {
    const newIsFavorite = !isFavorite;
    setIsFavorite(newIsFavorite);
    
    // Update localStorage
    const savedFavorites = localStorage.getItem('productFavorites');
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    if (newIsFavorite) {
      if (!favorites.includes(parseInt(id))) {
        favorites.push(parseInt(id));
      }
    } else {
      favorites = favorites.filter((productId: number) => productId !== parseInt(id));
    }
    
    localStorage.setItem('productFavorites', JSON.stringify(favorites));
  };
  
  const handleQuantityChange = (e: CustomEvent) => {
    const value = parseInt(e.detail.value);
    if (!isNaN(value) && value > 0) {
      // Don't allow quantity to exceed stock
      if (product && value <= product.stock) {
        setQuantity(value);
      } else if (product) {
        setQuantity(product.stock);
      }
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };
  
  const addToCart = () => {
    if (!product) return;
    
    // Check if product is in stock
    if (product.stock === 0) {
      setShowOutOfStockAlert(true);
      return;
    }
    
    // Get cart from localStorage
    const savedCart = localStorage.getItem('cart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    // Check if product is already in cart
    const existingCartItemIndex = cartItems.findIndex((item: any) => item.id === product.id);
    
    if (existingCartItemIndex >= 0) {
      // Update quantity if already in cart
      cartItems[existingCartItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cartItems.push({ id: product.id, quantity });
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Show success toast
    setToastMessage(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart`);
    setShowToast(true);
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'Product',
        text: `Check out ${product?.name} on our Pet Shop!`,
        url: window.location.href
      }).catch(err => {
        console.error('Could not share:', err);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          setToastMessage('Link copied to clipboard!');
          setShowToast(true);
        })
        .catch(err => {
          console.error('Could not copy link:', err);
        });
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return 'warning';
      case 'toys':
        return 'tertiary';
      case 'accessories':
        return 'success';
      case 'grooming':
        return 'primary';
      default:
        return 'medium';
    }
  };
  
  if (isLoading) {
    return <IonLoading isOpen={true} message="Loading product details..." />;
  }
  
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/products" />
            </IonButtons>
            <IonTitle>Product Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonText color="danger">
              <h5>Error loading product details</h5>
              <p>{error}</p>
            </IonText>
            <IonButton onClick={() => fetchProductById(parseInt(id))}>
              Try Again
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
  if (!product) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/products" />
            </IonButtons>
            <IonTitle>Product Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonText color="medium">
              <h5>Product not found</h5>
              <p>The product you're looking for doesn't exist or has been removed.</p>
            </IonText>
            <IonButton routerLink="/products" color="petprimary">
              Back to Products
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/products" />
          </IonButtons>
          <IonTitle>{product.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleShare}>
              <IonIcon slot="icon-only" icon={shareOutline} />
            </IonButton>
            <IonButton onClick={toggleFavorite}>
              <IonIcon
                slot="icon-only"
                icon={isFavorite ? star : starOutline}
                color={isFavorite ? 'warning' : 'light'}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="product-image-container">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-detail-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <IonIcon icon={basket} />
            </div>
          )}
        </div>
        
        <div className="product-content-container">
          <div className="product-header">
            <div className="product-title">
              <h1>{product.name}</h1>
              <div className="product-meta">
                <IonChip color={getCategoryColor(product.category)} outline>
                  <IonIcon icon={pricetag} />
                  <IonLabel>{product.category}</IonLabel>
                </IonChip>
                
                <IonBadge color={product.stock > 0 ? 'success' : 'danger'} className="stock-badge">
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </IonBadge>
              </div>
            </div>
            
            <div className="product-price">
              <div className="price-amount">${product.price.toFixed(2)}</div>
              {product.stock > 0 && <div className="stock-count">{product.stock} available</div>}
            </div>
          </div>
          
          <IonCard>
            <IonCardContent>
              <h2>Description</h2>
              <p className="product-description">
                {product.description || `${product.name} - a quality product for your pet.`}
              </p>
              
              <div className="quantity-container">
                <div className="quantity-label">Quantity:</div>
                <div className="quantity-control">
                  <IonButton
                    fill="clear"
                    color="medium"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || product.stock === 0}
                  >
                    <IonIcon slot="icon-only" icon={remove} />
                  </IonButton>
                  
                  <IonInput
                    type="number"
                    value={quantity}
                    onIonChange={handleQuantityChange}
                    min={1}
                    max={product.stock}
                    inputmode="numeric"
                    disabled={product.stock === 0}
                    className="quantity-input"
                  />
                  
                  <IonButton
                    fill="clear"
                    color="medium"
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock || product.stock === 0}
                  >
                    <IonIcon slot="icon-only" icon={add} />
                  </IonButton>
                </div>
              </div>
              
              <IonButton
                expand="block"
                color="petsecondary"
                disabled={product.stock === 0}
                onClick={addToCart}
              >
                <IonIcon slot="start" icon={cart} />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </IonButton>
              
              {product.stock === 0 && (
                <div className="out-of-stock-notice">
                  <IonIcon icon={informationCircle} color="danger" />
                  <IonText color="danger">
                    This product is currently out of stock. Please check back later.
                  </IonText>
                </div>
              )}
            </IonCardContent>
          </IonCard>
          
          <IonCard>
            <IonCardContent>
              <h2>Specifications</h2>
              
              <IonGrid className="specs-grid">
                <IonRow>
                  <IonCol size="6">
                    <div className="spec-item">
                      <div className="spec-label">Category</div>
                      <div className="spec-value">{product.category}</div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div className="spec-item">
                      <div className="spec-label">Price</div>
                      <div className="spec-value">${product.price.toFixed(2)}</div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div className="spec-item">
                      <div className="spec-label">Stock</div>
                      <div className="spec-value">{product.stock}</div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div className="spec-item">
                      <div className="spec-label">Product ID</div>
                      <div className="spec-value">{product.id}</div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
          
          {/* Recommended Products would normally be fetched from API */}
          <div className="recommended-section">
            <h2>You May Also Like</h2>
            <IonText color="medium" className="recommended-empty">
              <p>Recommendations based on this product will appear here.</p>
            </IonText>
          </div>
        </div>
        
        {/* Out of Stock Alert */}
        <IonAlert
          isOpen={showOutOfStockAlert}
          onDidDismiss={() => setShowOutOfStockAlert(false)}
          header="Out of Stock"
          message="Sorry, this product is currently out of stock."
          buttons={['OK']}
        />
        
        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          buttons={[
            {
              text: 'Close',
              role: 'cancel',
              icon: close
            }
          ]}
        />
      </IonContent>
      
      <style jsx>{`
        .product-image-container {
          height: 250px;
          width: 100%;
          overflow: hidden;
          background-color: #f8f8f8;
        }
        
        .product-detail-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .product-image-placeholder ion-icon {
          font-size: 5rem;
          color: #cccccc;
        }
        
        .product-content-container {
          padding: 16px;
        }
        
        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .product-title {
          flex: 1;
        }
        
        .product-title h1 {
          margin: 0 0 8px 0;
          font-size: 1.8rem;
          font-weight: 600;
        }
        
        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .product-price {
          text-align: right;
          margin-left: 16px;
        }
        
        .price-amount {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--ion-color-petsecondary);
        }
        
        .stock-count {
          font-size: 0.8rem;
          color: var(--ion-color-medium);
        }
        
        .stock-badge {
          padding: 8px 12px;
        }
        
        .product-description {
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 20px;
          color: var(--ion-color-dark);
        }
        
        .quantity-container {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .quantity-label {
          font-weight: 500;
          margin-right: 16px;
        }
        
        .quantity-control {
          display: flex;
          align-items: center;
          border: 1px solid var(--ion-color-light-shade);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .quantity-input {
          width: 60px;
          text-align: center;
        }
        
        .out-of-stock-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 8px;
          background-color: rgba(var(--ion-color-danger-rgb), 0.1);
          border-radius: 8px;
        }
        
        .specs-grid {
          margin-top: 16px;
        }
        
        .spec-item {
          margin-bottom: 16px;
        }
        
        .spec-label {
          font-size: 0.85rem;
          color: var(--ion-color-medium);
          margin-bottom: 4px;
        }
        
        .spec-value {
          font-size: 1rem;
          font-weight: 500;
        }
        
        .recommended-section {
          margin-top: 24px;
          margin-bottom: 24px;
        }
        
        .recommended-section h2 {
          font-size: 1.3rem;
          margin-bottom: 16px;
        }
        
        .recommended-empty {
          padding: 20px;
          text-align: center;
          background-color: #f8f8f8;
          border-radius: 8px;
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
          height: 100%;
        }
      `}</style>
    </IonPage>
  );
};

export default ProductDetail;