import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastService } from '../../../services/toast.service';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.page.html',
  styleUrls: ['./product-management.page.scss'],
})
export class ProductManagementPage implements OnInit {
  products: Product[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  
  // Form for adding/editing products
  productForm: FormGroup;
  isEditMode: boolean = false;
  currentProductId: number | null = null;
  selectedImage: string | null = null;
  imageFile: File | null = null;
  
  // Available product categories
  categories: string[] = ['food', 'toys', 'accessories', 'grooming', 'other'];
  
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      price: ['', [Validators.required, Validators.min(0.01)]],
      category: ['other', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('products').subscribe(
        response => {
          if (response.success) {
            this.products = response.data;
          } else {
            this.toastService.error('Failed to load products');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching products:', error);
          this.toastService.error('Failed to load products');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading products:', error);
      this.loading = false;
    }
  }
  
  async selectImage() {
    const actionSheet = await this.alertController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          }
        },
        {
          text: 'Choose from Gallery',
          handler: () => {
            this.takePicture(CameraSource.Photos);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }
  
  async takePicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: source
      });
      
      // Display the image preview
      this.selectedImage = image.webPath;
      
      // Convert to blob for upload
      const response = await fetch(image.webPath!);
      const blob = await response.blob();
      this.imageFile = new File([blob], `image.${image.format}`, { type: `image/${image.format}` });
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }
  
  async openProductForm(product?: Product) {
    if (product) {
      // Edit mode
      this.isEditMode = true;
      this.currentProductId = product.id;
      this.productForm.patchValue({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock: product.stock
      });
      this.selectedImage = product.imageUrl || null;
    } else {
      // Add mode
      this.isEditMode = false;
      this.currentProductId = null;
      this.productForm.reset({
        category: 'other',
        stock: 0
      });
      this.selectedImage = null;
      this.imageFile = null;
    }
    
    const alert = await this.alertController.create({
      header: this.isEditMode ? 'Edit Product' : 'Add New Product',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Product Name',
          value: this.productForm.value.name
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)',
          value: this.productForm.value.description
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Price',
          value: this.productForm.value.price,
          min: 0.01,
          step: 0.01
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Category',
          value: this.productForm.value.category
        },
        {
          name: 'stock',
          type: 'number',
          placeholder: 'Stock quantity',
          value: this.productForm.value.stock,
          min: 0
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: this.isEditMode ? 'Update' : 'Add',
          handler: (data) => {
            this.productForm.patchValue({
              name: data.name,
              description: data.description,
              price: data.price,
              category: data.category,
              stock: data.stock
            });
            
            if (this.productForm.valid) {
              if (this.isEditMode) {
                this.updateProduct();
              } else {
                this.addProduct();
              }
            } else {
              this.toastService.error('Please complete all required fields');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async addProduct() {
    if (this.productForm.invalid) return;
    
    await this.loadingService.show('Adding product...');
    
    const formData = new FormData();
    formData.append('name', this.productForm.value.name);
    formData.append('description', this.productForm.value.description || '');
    formData.append('price', this.productForm.value.price);
    formData.append('category', this.productForm.value.category);
    formData.append('stock', this.productForm.value.stock);
    
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    
    this.apiService.upload<any>('products', formData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Product added successfully');
          this.productForm.reset();
          this.selectedImage = null;
          this.imageFile = null;
          this.loadProducts();
        } else {
          this.toastService.error(response.message || 'Failed to add product');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to add product');
      }
    );
  }
  
  async updateProduct() {
    if (this.productForm.invalid || !this.currentProductId) return;
    
    await this.loadingService.show('Updating product...');
    
    const formData = new FormData();
    formData.append('name', this.productForm.value.name);
    formData.append('description', this.productForm.value.description || '');
    formData.append('price', this.productForm.value.price);
    formData.append('category', this.productForm.value.category);
    formData.append('stock', this.productForm.value.stock);
    
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    
    this.apiService.updateWithFile<any>(`products/${this.currentProductId}`, formData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Product updated successfully');
          this.productForm.reset();
          this.selectedImage = null;
          this.imageFile = null;
          this.currentProductId = null;
          this.loadProducts();
        } else {
          this.toastService.error(response.message || 'Failed to update product');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to update product');
      }
    );
  }
  
  async deleteProduct(product: Product) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${product.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.confirmDeleteProduct(product.id);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmDeleteProduct(productId: number) {
    await this.loadingService.show('Deleting product...');
    
    this.apiService.delete<any>(`products/${productId}`).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Product deleted successfully');
          this.loadProducts();
        } else {
          this.toastService.error(response.message || 'Failed to delete product');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to delete product');
      }
    );
  }
  
  onSearch(event: any) {
    this.searchTerm = event.detail.value;
  }
  
  filterProducts(): Product[] {
    if (!this.searchTerm) {
      return this.products;
    }
    
    const searchTerm = this.searchTerm.toLowerCase();
    return this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }
  
  // Helper to format price
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
  
  refreshData(event: any) {
    this.loadProducts();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
