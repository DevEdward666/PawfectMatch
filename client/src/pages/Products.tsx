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
  IonToast,
  IonToolbar
} from '@ionic/react';
import {
  basket,
  cart,
  cash,
  close,
  filter,
  pricetag,
  search,
  star,
  starOutline
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { Product } from '../models/product.model';
import "./Products.css";
const Products: React.FC = () => {
  const { products, isLoading, error, fetchProducts } = useProducts();
  // const { isLoggedIn } = useAuth();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [cartItems, setCartItems] = useState<{ id: number, quantity: number }[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Load products on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProducts();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('productFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, [fetchProducts]);
  
  // Filter products when search text or filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (products) {
      let filtered = [...products];
      
      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter(product => 
          product.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      
      // Apply price range filter
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(val => parseInt(val));
        if (max) {
          filtered = filtered.filter(product => 
            product.price >= min && product.price <= max
          );
        } else {
          filtered = filtered.filter(product => product.price >= min);
        }
      }
      
      // Apply search text filter
      if (searchText) {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchText.toLowerCase())) ||
          product.category.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      // Sort by in-stock first, then by name
      filtered.sort((a, b) => {
        // Sort by stock (in stock first)
        if (a.stock > 0 && b.stock === 0) return -1;
        if (a.stock === 0 && b.stock > 0) return 1;
        
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
      
      setFilteredProducts(filtered);
    }
  }, [products, searchText, selectedCategory, priceRange]);
  
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchProducts().then(() => {
      event.detail.complete();
    });
  };
  
  const toggleFavorite = (productId: number) => {
    let newFavorites;
    if (favorites.includes(productId)) {
      newFavorites = favorites.filter(id => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('productFavorites', JSON.stringify(newFavorites));
  };
  
  const addToCart = (productId: number) => {
    // Check if product is in stock
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) {
      setToastMessage("Sorry, this product is out of stock");
      setShowToast(true);
      return;
    }
    
    // Check if product is already in cart
    const existingCartItemIndex = cartItems.findIndex(item => item.id === productId);
    let newCartItems;
    
    if (existingCartItemIndex >= 0) {
      // Increment quantity if already in cart
      newCartItems = [...cartItems];
      newCartItems[existingCartItemIndex].quantity += 1;
    } else {
      // Add new item to cart
      newCartItems = [...cartItems, { id: productId, quantity: 1 }];
    }
    
    setCartItems(newCartItems);
    localStorage.setItem('cart', JSON.stringify(newCartItems));
    
    // Show success toast
    setToastMessage(`${product.name} added to cart`);
    setShowToast(true);
  };
  
  const resetFilters = () => {
    setSelectedCategory('');
    setPriceRange('');
    setSearchText('');
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Shop Products</IonTitle>
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
                    placeholder="Search products"
                    animated
                    showCancelButton="focus"
                  />
                </IonCol>
                <IonCol size="6">
                  <IonSelect
                    value={selectedCategory}
                    placeholder="Category"
                    onIonChange={e => setSelectedCategory(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="">All Categories</IonSelectOption>
                    <IonSelectOption value="food">Food</IonSelectOption>
                    <IonSelectOption value="toys">Toys</IonSelectOption>
                    <IonSelectOption value="accessories">Accessories</IonSelectOption>
                    <IonSelectOption value="grooming">Grooming</IonSelectOption>
                    <IonSelectOption value="other">Other</IonSelectOption>
                  </IonSelect>
                </IonCol>
                <IonCol size="6">
                  <IonSelect
                    value={priceRange}
                    placeholder="Price Range"
                    onIonChange={e => setPriceRange(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="">Any Price</IonSelectOption>
                    <IonSelectOption value="0-10">Under $10</IonSelectOption>
                    <IonSelectOption value="10-25">$10 - $25</IonSelectOption>
                    <IonSelectOption value="25-50">$25 - $50</IonSelectOption>
                    <IonSelectOption value="50-100">$50 - $100</IonSelectOption>
                    <IonSelectOption value="100-9999">$100+</IonSelectOption>
                  </IonSelect>
                </IonCol>
                <IonCol size="12">
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={resetFilters}
                  >
                    Reset Filters
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
          <IonLoading isOpen={true} message="Loading products..." />
        ) : error ? (
          <div className="error-container">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton onClick={() => fetchProducts()}>Try Again</IonButton>
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
                        {filteredProducts.length} products
                      </h4>
                      {selectedCategory && (
                        <IonChip
                          color={getCategoryColor(selectedCategory)}
                          outline
                        >
                          <IonIcon icon={basket} />
                          <IonLabel>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</IonLabel>
                        </IonChip>
                      )}
                      {priceRange && (
                        <IonChip outline>
                          <IonIcon icon={cash} />
                          <IonLabel>
                            {priceRange === '100-9999' ? '$100+' : 
                             `$${priceRange.split('-').join(' - $')}`}
                          </IonLabel>
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
            
            {/* Products grid */}
            <IonGrid>
              <IonRow>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <IonCol
                      size="12"
                      sizeSm="6"
                      sizeMd="4"
                      sizeXl="3"
                      key={product.id}
                    >
                      <IonCard className="product-card" routerLink={`/products/${product.id}`}>
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
                          
                          <IonButton
                            fill="clear"
                            className="favorite-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              toggleFavorite(product.id);
                            }}
                          >
                            <IonIcon
                              icon={favorites.includes(product.id) ? star : starOutline}
                              color={favorites.includes(product.id) ? 'warning' : 'light'}
                            />
                          </IonButton>
                        </div>
                        
                        <IonCardHeader>
                          <IonChip color={getCategoryColor(product.category)} outline >
                            <IonIcon icon={pricetag} />
                            <IonLabel>{product.category}</IonLabel>
                          </IonChip>
                          <IonCardTitle>{product.name}</IonCardTitle>
                          <IonCardSubtitle>
                            {product.stock > 0 ? (
                              <IonText color="success">In Stock ({product.stock})</IonText>
                            ) : (
                              <IonText color="danger">Out of Stock</IonText>
                            )}
                          </IonCardSubtitle>
                        </IonCardHeader>
                        
                        <IonCardContent>
                          <p className="product-description">
                            {product.description || `${product.name} - a quality product for your pet.`}
                          </p>
                          
                          <div className="card-actions">
                            <IonButton fill="solid" color="primary" size="small">
                              View Details
                            </IonButton>
                            
                            <IonButton
                              fill="clear"
                              color="petsecondary"
                              disabled={product.stock === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                addToCart(product.id);
                              }}
                            >
                              <IonIcon slot="icon-only" icon={cart} />
                            </IonButton>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))
                ) : (
                  <IonCol size="12">
                    <div className="empty-state">
                      <IonIcon icon={basket} color="medium" />
                      <IonText color="medium">
                        <h5>No products found matching your criteria</h5>
                        <p>Try adjusting your filters or check back later for more products.</p>
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
        
        <IonInfiniteScroll>
          <IonInfiniteScrollContent loadingText="Loading more products..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>
        
        {/* Cart Toast */}
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
      
    </IonPage>
  );
};

export default Products;