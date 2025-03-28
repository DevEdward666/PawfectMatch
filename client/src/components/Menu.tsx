import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  homeOutline,
  homeSharp,
  pawOutline,
  pawSharp,
  cartOutline,
  cartSharp,
  mailOutline,
  mailSharp,
  personOutline,
  personSharp,
  alertCircleOutline,
  alertCircleSharp,
  shieldOutline,
  shieldSharp,
  logInOutline,
  logInSharp,
  personAddOutline,
  personAddSharp,
  logOutOutline,
  logOutSharp,
} from 'ionicons/icons';

import { useAuth } from '../contexts/AuthContext';

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const Menu: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, isAdmin, logout, user } = useAuth();

  const appPages: AppPage[] = [
    {
      title: 'Home',
      url: '/home',
      iosIcon: homeOutline,
      mdIcon: homeSharp
    },
    {
      title: 'Pets',
      url: '/pets',
      iosIcon: pawOutline,
      mdIcon: pawSharp
    },
    {
      title: 'Products',
      url: '/products',
      iosIcon: cartOutline,
      mdIcon: cartSharp
    },
    {
      title: 'Messages',
      url: '/messages',
      iosIcon: mailOutline,
      mdIcon: mailSharp,
      requireAuth: true
    },
    {
      title: 'Profile',
      url: '/profile',
      iosIcon: personOutline,
      mdIcon: personSharp,
      requireAuth: true
    },
    {
      title: 'Report',
      url: '/report',
      iosIcon: alertCircleOutline,
      mdIcon: alertCircleSharp,
      requireAuth: true
    },
    {
      title: 'Admin',
      url: '/admin',
      iosIcon: shieldOutline,
      mdIcon: shieldSharp,
      adminOnly: true
    }
  ];

  const renderMenuItems = () => {
    return appPages.map((appPage, index) => {
      // Skip admin-only pages if user is not admin
      if (appPage.adminOnly && !isAdmin()) return null;
      
      // Skip auth-required pages if user is not logged in
      if (appPage.requireAuth && !isLoggedIn()) return null;

      return (
        <IonMenuToggle key={index} autoHide={false}>
          <IonItem 
            className={location.pathname === appPage.url ? 'selected' : ''} 
            routerLink={appPage.url} 
            routerDirection="none" 
            lines="none" 
            detail={false}
          >
            <IonIcon slot="start" ios={appPage.iosIcon} md={appPage.mdIcon} />
            <IonLabel>{appPage.title}</IonLabel>
          </IonItem>
        </IonMenuToggle>
      );
    });
  };

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList>
          <IonListHeader>Pet Shop App</IonListHeader>
          <IonNote>Welcome {user ? user.fullName || user.username : 'Guest'}</IonNote>
          
          {renderMenuItems()}

          {/* Auth menu items */}
          {!isLoggedIn() ? (
            <>
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/login" routerDirection="none" lines="none" detail={false}>
                  <IonIcon slot="start" ios={logInOutline} md={logInSharp} />
                  <IonLabel>Login</IonLabel>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/register" routerDirection="none" lines="none" detail={false}>
                  <IonIcon slot="start" ios={personAddOutline} md={personAddSharp} />
                  <IonLabel>Register</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </>
          ) : (
            <IonMenuToggle autoHide={false}>
              <IonItem button onClick={() => logout()} lines="none" detail={false}>
                <IonIcon slot="start" ios={logOutOutline} md={logOutSharp} />
                <IonLabel>Logout</IonLabel>
              </IonItem>
            </IonMenuToggle>
          )}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;