import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, paw, basket, chatbubbleEllipses, person, warning } from 'ionicons/icons';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Report from './pages/Report';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Messages from './pages/Messages';
import MessageDetail from './pages/MessageDetail';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { PetProvider } from './contexts/PetContext';
import { ProductProvider } from './contexts/ProductContext';
import { MessageProvider } from './contexts/MessageContext';
import { ReportProvider } from './contexts/ReportContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

// Initialize Ionic
setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <PetProvider>
        <ProductProvider>
          <MessageProvider>
            <ReportProvider>
              <IonReactRouter>
                <IonTabs>
                  <IonRouterOutlet>
                    {/* Main Tab Routes */}
                    <Route exact path="/home" component={Home} />
                    <Route exact path="/pets" component={Pets} />
                    <Route exact path="/products" component={Products} />
                    <Route exact path="/messages" component={Messages} />
                    <Route exact path="/profile" component={Profile} />
                    
                    {/* Auth Routes */}
                    <Route exact path="/login" component={Login} />
                    <Route exact path="/register" component={Register} />
                    
                    {/* Default Route */}
                    <Route exact path="/">
                      <Redirect to="/home" />
                    </Route>
                  </IonRouterOutlet>
                  
                  <IonTabBar slot="bottom">
                    <IonTabButton tab="home" href="/home">
                      <IonIcon icon={home} />
                      <IonLabel>Home</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="pets" href="/pets">
                      <IonIcon icon={paw} />
                      <IonLabel>Pets</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="products" href="/products">
                      <IonIcon icon={basket} />
                      <IonLabel>Shop</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="messages" href="/messages">
                      <IonIcon icon={chatbubbleEllipses} />
                      <IonLabel>Messages</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="profile" href="/profile">
                      <IonIcon icon={person} />
                      <IonLabel>Profile</IonLabel>
                    </IonTabButton>
                  </IonTabBar>
                </IonTabs>

                {/* Non-Tab Routes */}
                <Route exact path="/report" component={Report} />
                <Route exact path="/pets/:id" component={PetDetail} />
                <Route exact path="/products/:id" component={ProductDetail} />
                <Route exact path="/messages/:id" component={MessageDetail} />
              </IonReactRouter>
            </ReportProvider>
          </MessageProvider>
        </ProductProvider>
      </PetProvider>
    </AuthProvider>
  </IonApp>
);

export default App;