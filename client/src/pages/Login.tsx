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
  IonButtons
} from '@ionic/react';
import { logIn, mail, lockClosed, person } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { Redirect } from 'react-router-dom';
import "./Login.css"
const Login: React.FC = () => {
  const { login, isLoading, error, isLoggedIn } = useAuth();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  
  // If user is already logged in, redirect to home
  if (isLoggedIn()) {
    return <Redirect to="/home" />;
  }
  
  const handleChange = (e: CustomEvent) => {
    const { name, value } = e.detail.event.target;
    console.log(e)
    setCredentials({
      ...credentials,
      [name]: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.email && credentials.password) {
      await login(credentials);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6">
              <div className="login-logo">
                <img src="/assets/logo.png" alt="PetShop Logo" />
              </div>
              
              <form onSubmit={handleSubmit}>
                <IonItem>
                  <IonIcon icon={mail} slot="start" color="petprimary" />
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    name="email"
                    value={credentials.email}
                    onIonChange={handleChange}
                    required
                  />
                </IonItem>
                
                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={lockClosed} slot="start" color="petprimary" />
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput
                    type="password"
                    name="password"
                    value={credentials.password}
                    onIonChange={handleChange}
                    required
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
                  color="petprimary"
                  disabled={isLoading || !credentials.email || !credentials.password}
                >
                  <IonIcon slot="start" icon={logIn} />
                  Login
                </IonButton>
              </form>
              
              <div className="ion-text-center ion-padding-top">
                <IonText color="medium">
                  <p>Don't have an account yet?</p>
                </IonText>
                <IonButton routerLink="/register" expand="block" fill="outline" color="petprimary">
                  <IonIcon slot="start" icon={person} />
                  Create Account
                </IonButton>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <IonLoading isOpen={isLoading} message="Please wait..." />
      </IonContent>
      
    </IonPage>
  );
};

export default Login;