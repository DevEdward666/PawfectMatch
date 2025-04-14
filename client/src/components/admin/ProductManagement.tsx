import {
  IonAlert,
  IonAvatar,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
  basket,
  closeOutline,
  create,
  ellipsisVertical,
  eyeOutline,
  filterOutline,
  refreshOutline,
  trash
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useProducts } from '../../contexts/ProductContext';
import { usePhotoGallery } from '../../hooks/usePhotoGallery';
import { Product, ProductForm } from '../../models/product.model';

const ProductManagement: React.FC = () => {
  const {
    products,
    isLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProducts();
  
  const [present] = useIonActionSheet();
  const [presentToast] = useIonToast();
  
  // State variables
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    category: 'other',
    stock: 0
  });
  
  const { photos, takePhoto } = usePhotoGallery();
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  
  // Effects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadProducts();
  }, []);
  
  // Functions
  const loadProducts = async () => {
    await fetchProducts();
  };
  
  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value!);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'other',
      stock: 0
    });
    setPhotoPreview(undefined);
    // deletePhotos();
  };
  
  const openAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };
  
  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stock: product.stock
    });
    setPhotoPreview(product.imageUrl);
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
      if (!formData.name || formData.price <= 0) {
        presentToast({
          message: 'Name and a valid price are required',
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
        imageFile = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
      }
      
      // Update or create
      if (isEditMode && currentProduct) {
        await updateProduct(currentProduct.id, {
          ...formData,
          image: imageFile
        });
        presentToast({
          message: 'Product updated successfully',
          duration: 3000,
          color: 'success'
        });
      } else {
        await createProduct({
          ...formData,
          image: imageFile
        });
        presentToast({
          message: 'Product added successfully',
          duration: 3000,
          color: 'success'
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error submitting form:', error);
      presentToast({
        message: 'Error processing your request',
        duration: 3000,
        color: 'danger'
      });
    }
  };
  
  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteAlert(true);
  };
  
  const handleDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete.id);
        presentToast({
          message: 'Product deleted successfully',
          duration: 3000,
          color: 'success'
        });
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        presentToast({
          message: 'Error deleting product',
          duration: 3000,
          color: 'danger'
        });
      }
    }
    setShowDeleteAlert(false);
    setProductToDelete(null);
  };
  
  const showOptions = (product: Product) => {
    present({
      header: 'Actions',
      buttons: [
        {
          text: 'View Details',
          icon: eyeOutline,
          handler: () => openEditModal(product)
        },
        {
          text: 'Edit',
          icon: create,
          handler: () => openEditModal(product)
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: trash,
          handler: () => confirmDelete(product)
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };
  
  // Filtering products
  const filteredProducts = products?.filter(product => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    ?.filter(product => {
      // Category filter
      if (categoryFilter !== 'all') {
        return product.category === categoryFilter;
      }
      return true;
    })
    ?.filter(product => {
      // Stock filter
      if (stockFilter === 'low') {
        return product.stock < 10;
      } else if (stockFilter === 'out') {
        return product.stock === 0;
      }
      return true;
    });
    
  return (
    <div className="ion-padding">
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="ion-padding-bottom">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Product Management</div>
                    <div>
                      <IonButton fill="clear" onClick={() => setShowFilter(!showFilter)}>
                        <IonIcon icon={filterOutline} />
                      </IonButton>
                      <IonButton fill="clear" onClick={loadProducts}>
                        <IonIcon icon={refreshOutline} />
                      </IonButton>
                      <IonButton onClick={openAddModal}>
                        <IonIcon icon={add} /> Add Product
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
                            placeholder="Search products"
                          />
                        </IonCol>
                        
                        <IonCol size="6" sizeMd="4">
                          <IonItem>
                            <IonLabel>Category</IonLabel>
                            <IonSelect 
                              value={categoryFilter} 
                              onIonChange={e => setCategoryFilter(e.detail.value)}
                            >
                              <IonSelectOption value="all">All</IonSelectOption>
                              <IonSelectOption value="food">Food</IonSelectOption>
                              <IonSelectOption value="toys">Toys</IonSelectOption>
                              <IonSelectOption value="accessories">Accessories</IonSelectOption>
                              <IonSelectOption value="grooming">Grooming</IonSelectOption>
                              <IonSelectOption value="other">Other</IonSelectOption>
                            </IonSelect>
                          </IonItem>
                        </IonCol>
                        
                        <IonCol size="6" sizeMd="4">
                          <IonItem>
                            <IonLabel>Stock</IonLabel>
                            <IonSelect 
                              value={stockFilter} 
                              onIonChange={e => setStockFilter(e.detail.value)}
                            >
                              <IonSelectOption value="all">All</IonSelectOption>
                              <IonSelectOption value="low">Low Stock (less then 10)</IonSelectOption>
                              <IonSelectOption value="out">Out of Stock</IonSelectOption>
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
                    <p>Loading products...</p>
                  </div>
                )}
                
                {!isLoading && filteredProducts.length === 0 && (
                  <div className="ion-text-center ion-padding">
                    <IonText color="medium">
                      <p>No products found. Try adjusting your filters or add a new product.</p>
                    </IonText>
                    <IonButton onClick={openAddModal}>
                      <IonIcon icon={add} slot="start" /> Add New Product
                    </IonButton>
                  </div>
                )}
                
                {!isLoading && filteredProducts.length > 0 && (
                  <IonList>
                    {filteredProducts.map(product => (
                      <IonItem key={product.id} className="ion-margin-bottom">
                        {product.imageUrl && (
                          <IonAvatar slot="start">
                            <img src={product.imageUrl} alt={product.name} />
                          </IonAvatar>
                        )}
                        {!product.imageUrl && (
                          <IonAvatar slot="start">
                            <div style={{ 
                              backgroundColor: '#f0f0f0', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              width: '100%',
                              height: '100%'
                            }}>
                              <IonIcon icon={basket} />
                            </div>
                          </IonAvatar>
                        )}
                        
                        <IonLabel>
                          <h2>{product.name}</h2>
                          <p>
                          <strong>${Number(product?.price ?? 0).toFixed(2)}</strong>
                          - {product.category}
                          </p>
                          <p>{product.description ? product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') : 'No description'}</p>
                        </IonLabel>
                        
                        <IonBadge 
                          color={
                            product.stock === 0 
                              ? 'danger' 
                              : product.stock < 10 
                                ? 'warning' 
                                : 'success'
                          }
                          slot="end"
                        >
                          {product.stock} in stock
                        </IonBadge>
                        
                        <IonButton fill="clear" slot="end" onClick={() => showOptions(product)}>
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
      
      {/* Add/Edit Product Modal */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</IonTitle>
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
                placeholder="Enter product name"
                required
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Price ($) *</IonLabel>
              <IonInput
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onIonChange={e => handleInputChange('price', e.detail.value ? parseFloat(e.detail.value) : 0)}
                placeholder="0.00"
                required
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={e => handleInputChange('category', e.detail.value)}
              >
                <IonSelectOption value="food">Food</IonSelectOption>
                <IonSelectOption value="toys">Toys</IonSelectOption>
                <IonSelectOption value="accessories">Accessories</IonSelectOption>
                <IonSelectOption value="grooming">Grooming</IonSelectOption>
                <IonSelectOption value="other">Other</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Stock Quantity *</IonLabel>
              <IonInput
                type="number"
                min="0"
                value={formData.stock}
                onIonChange={e => handleInputChange('stock', e.detail.value ? parseInt(e.detail.value, 10) : 0)}
                placeholder="0"
                required
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={e => handleInputChange('description', e.detail.value!)}
                placeholder="Describe the product..."
                rows={4}
              />
            </IonItem>
            
            <div className="ion-padding">
              <IonLabel>Product Image</IonLabel>
              <div style={{ marginTop: '10px', marginBottom: '20px' }}>
                {photoPreview ? (
                  <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                    <img 
                      src={photoPreview} 
                      alt="Product" 
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
                    <IonIcon icon={basket} size="large" color="medium" />
                  </div>
                )}
              </div>
              
              <IonButton onClick={handleTakePhoto} expand="block">
                {photoPreview ? 'Replace Photo' : 'Take Photo'}
              </IonButton>
            </div>
            
            <div className="ion-padding ion-text-center">
              <IonButton expand="block" type="submit">
                {isEditMode ? 'Update Product' : 'Add Product'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
      
      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message={`Are you sure you want to delete ${productToDelete?.name}? This action cannot be undone.`}
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

export default ProductManagement;