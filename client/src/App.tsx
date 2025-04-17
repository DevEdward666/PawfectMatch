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
import { chatbubbleEllipses, home, person } from 'ionicons/icons';
import React from 'react';
import { Redirect, Route } from 'react-router';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import MessageDetail from './pages/MessageDetail';
import Messages from './pages/Messages';
import PetDetail from './pages/PetDetail';
import Pets from './pages/Pets';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Report from './pages/Report';

// Contexts
import { UserProvider } from './contexts/UserContext';

import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { PetProvider } from './contexts/PetContext';
import { ProductProvider } from './contexts/ProductContext';
import { ReportProvider } from './contexts/ReportContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/* Theme variables */
import Admin from 'pages/Admin';
import ReportDetail from 'pages/ReportDetails';
import './theme/variables.css';

// Initialize Ionic
setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <UserProvider>
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
                    <Route exact path="/report" component={Report} />
                    {/* Auth Routes */}
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
                    {/* <IonTabButton tab="pets" href="/pets">
                      <IonIcon icon={paw} />
                      <IonLabel>Pets</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="products" href="/products">
                      <IonIcon icon={basket} />
                      <IonLabel>Shop</IonLabel>
                    </IonTabButton> */}
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

                <Route exact path="/login" component={Login} />
                <Route exact path="/admin" component={Admin} />
                <Route exact path="/pets/:id" component={PetDetail} />
                <Route exact path="/pets/forAdoption/:id/:isForAdoption" component={PetDetail} />
                <Route exact path="/products/:id" component={ProductDetail} />
                <Route exact path="/messages/:id" component={MessageDetail} />
                <Route exact path="/reports/:id" component={ReportDetail} />
              </IonReactRouter>
            </ReportProvider>
          </MessageProvider>
        </ProductProvider>
      </PetProvider>
      </UserProvider>
    </AuthProvider>
  </IonApp>
);

export default App;