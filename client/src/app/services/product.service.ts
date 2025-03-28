import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductForm } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`);
  }

  createProduct(productData: ProductForm, image?: File): Observable<Product> {
    const formData = new FormData();
    
    // Add product data to form
    Object.keys(productData).forEach(key => {
      formData.append(key, (productData as any)[key]);
    });
    
    // Add image if available
    if (image) {
      formData.append('image', image);
    }
    
    return this.http.post<Product>(this.apiUrl, formData);
  }

  updateProduct(id: number, productData: ProductForm, image?: File): Observable<Product> {
    const formData = new FormData();
    
    // Add product data to form
    Object.keys(productData).forEach(key => {
      formData.append(key, (productData as any)[key]);
    });
    
    // Add image if available
    if (image) {
      formData.append('image', image);
    }
    
    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}