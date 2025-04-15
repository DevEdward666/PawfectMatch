import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonLoading,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonNote
} from '@ionic/react';
import { 
  personAdd, 
  mail, 
  lockClosed, 
  person, 
  call, 
  location,
  logIn
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import "./Register.css"
import { Redirect } from 'react-router';
const Register: React.FC = () => {
  const { register, isLoading, error, isLoggedIn } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // If user is already logged in, redirect to home
  if (isLoggedIn()) {
    return <Redirect to="/home" />;
  }
  
  const handleChange = (e: CustomEvent) => {
    const { name, value } = e.detail.event.target;
    
    // Clear error when user types
    if (name === 'password' || name === 'confirmPassword') {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validatePassword = () => {
    let isValid = true;
    
    // Reset errors
    const errors = {
      password: '',
      confirmPassword: ''
    };
    
    // Check password length
    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    if (formData.username && formData.email && formData.password) {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      };
      
      await register(userData);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton color="light" defaultHref="/login" />
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6">
              <div className="register-header ion-text-center">
                <h2>Join Our Community</h2>
                <p>Create an account to adopt pets, shop for supplies, and report animal cruelty.</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <IonItem>
                  <IonIcon icon={person} slot="start" color="primary" />
                  <IonLabel position="stacked">Username*</IonLabel>
                  <IonInput
                    name="username"
                    value={formData.username}
                    onIonChange={handleChange}
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={mail} slot="start" color="primary" />
                  <IonLabel position="stacked">Email*</IonLabel>
                  <IonInput
                    type="email"
                    name="email"
                    value={formData.email}
                    onIonChange={handleChange}
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={lockClosed} slot="start" color="primary" />
                  <IonLabel position="stacked">Password*</IonLabel>
                  <IonInput
                    type="password"
                    name="password"
                    value={formData.password}
                    onIonChange={handleChange}
                    required
                  />
                  {formErrors.password && (
                    <IonNote slot="helper" color="danger">
                      {formErrors.password}
                    </IonNote>
                  )}
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={lockClosed} slot="start" color="primary" />
                  <IonLabel position="stacked">Confirm Password*</IonLabel>
                  <IonInput
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onIonChange={handleChange}
                    required
                  />
                  {formErrors.confirmPassword && (
                    <IonNote slot="helper" color="danger">
                      {formErrors.confirmPassword}
                    </IonNote>
                  )}
                </IonItem>
                
                <div className="section-divider">
                  <span>Optional Information</span>
                </div>
                
                <IonItem>
                  <IonIcon icon={person} slot="start" color="medium" />
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput
                    name="name"
                    value={formData.name}
                    onIonChange={handleChange}
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={call} slot="start" color="medium" />
                  <IonLabel position="stacked">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onIonChange={handleChange}
                  />
                </IonItem>
                
                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={location} slot="start" color="medium" />
                  <IonLabel position="stacked">Address</IonLabel>
                  <IonInput
                    name="address"
                    value={formData.address}
                    onIonChange={handleChange}
                  />
                </IonItem>
                
                {error && (
                  <IonText color="danger">
                    <p className="ion-text-center">{error}</p>
                  </IonText>
                )}
                
                <IonButton
                  expand="block"
                  type="submit"
                  color="primary"
                  disabled={
                    isLoading || 
                    !formData.username || 
                    !formData.email || 
                    !formData.password || 
                    !formData.confirmPassword
                  }
                >
                  <IonIcon slot="start" icon={personAdd} />
                  Create Account
                </IonButton>
              </form>
              
              <div className="ion-text-center ion-padding-top">
                <IonText color="medium">
                  <p>Already have an account?</p>
                </IonText>
                <IonButton routerLink="/login" expand="block" fill="outline" color="primary">
                  <IonIcon slot="start" icon={logIn} />
                  Login
                </IonButton>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <IonLoading isOpen={isLoading} message="Creating account..." />
      </IonContent>
    </IonPage>
  );
};

export default Register;