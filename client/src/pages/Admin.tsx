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
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  alertCircleOutline,
  basket,
  chatbubbleEllipses,
  checkmarkCircle,
  heart,
  hourglassOutline,
  paw,
  people,
  refreshOutline,
  timeOutline,
  warning
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import MessageManagement from '../components/admin/MessageManagement';
import PetManagement from '../components/admin/PetManagement';
import ProductManagement from '../components/admin/ProductManagement';
import ReportManagement from '../components/admin/ReportManagement';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface DashboardStats {
  counts: {
    users: number;
    pets: number;
    products: number;
    adoptions: number;
    reports: number;
  };
  pending: {
    adoptions: number;
    reports: number;
    messages: number;
  };
  trends: {
    users: Array<{ date: string; count: number }>;
    adoptions: Array<{ date: string; count: number }>;
  };
}

interface RecentAdoption {
  id: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
  pet: {
    id: number;
    name: string;
    species: string;
    breed?: string;
  };
}

interface RecentReport {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
}

interface LowStockProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface InventoryStatus {
  lowStockProducts: LowStockProduct[];
  petsBySpecies: Array<{ species: string; count: number }>;
  petsByStatus: Array<{ status: string; count: number }>;
}

const Admin: React.FC = () => {
  const { isLoggedIn, isAdmin,token } = useAuth();
  const [activeSegment, setActiveSegment] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAdoptions, setRecentAdoptions] = useState<RecentAdoption[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if (isLoggedIn() && isAdmin()) {
      fetchDashboardData();
    // }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats
      const statsResponse = await api.get('/dashboard/stats');
      setStats(statsResponse.data.data);

      // Fetch recent adoptions
      const adoptionsResponse = await api.get('/dashboard/recent-adoptions?limit=5');
      setRecentAdoptions(adoptionsResponse.data.data);

      // Fetch recent reports
      const reportsResponse = await api.get('/dashboard/recent-reports?limit=5');
      setRecentReports(reportsResponse.data.data);

      // Fetch inventory status
      const inventoryResponse = await api.get('/dashboard/inventory');
      setInventoryStatus(inventoryResponse.data.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = (event: CustomEvent) => {
    fetchDashboardData().then(() => {
      event.detail.complete();
    });
  };

  const navigateTo = (path: string) => {
    // Use this when we have separate admin pages for each section
    // For now, we'll use the segment approach
    console.log(`Navigate to: ${path}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'reviewing':
        return 'warning';
      case 'pending':
        return 'medium';
      case 'adopted':
        return 'primary';
      case 'available':
        return 'success';
      default:
        return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return checkmarkCircle;
      case 'reviewing':
        return alertCircleOutline;
      case 'pending':
        return hourglassOutline;
      default:
        return timeOutline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Redirect if not logged in or not admin
  // if (!isLoggedIn()) {
  //   return <Redirect to="/login" />;
  // }

  // if (isLoggedIn()) {
  //   return <Redirect to="/home" />;
  // }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Admin Dashboard</IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={fetchDashboardData}>
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeSegment} onIonChange={e => setActiveSegment(e.detail.value as string)}>
            <IonSegmentButton value="dashboard">
              <IonLabel>Dashboard</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="users">
              <IonLabel>Users</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="pets">
              <IonLabel>Pets</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="products">
              <IonLabel>Products</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="reports">
              <IonLabel>Reports</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="messages">
              <IonLabel>Messages</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading && (
          <IonLoading isOpen={true} message="Loading dashboard data..." />
        )}

        {error && (
          <div className="ion-padding">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton onClick={fetchDashboardData}>Retry</IonButton>
          </div>
        )}

        {/* Dashboard Overview */}
        {activeSegment === 'dashboard' && stats && (
          <div className="ion-padding">
            <IonGrid>
              {/* Statistics Cards */}
              <IonRow>
                <IonCol size="6" sizeMd="4">
                  <IonCard button onClick={() => setActiveSegment('users')} color="primary">
                    <IonCardContent className="ion-text-center">
                      <IonIcon icon={people} color="light" style={{ fontSize: '2rem' }} />
                      <h2 className="stat-value">{stats.counts.users}</h2>
                      <IonCardSubtitle color="light">Users</IonCardSubtitle>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                
                <IonCol size="6" sizeMd="4">
                  <IonCard button onClick={() => setActiveSegment('pets')} color="success">
                    <IonCardContent className="ion-text-center">
                      <IonIcon icon={paw} color="light" style={{ fontSize: '2rem' }} />
                      <h2 className="stat-value">{stats.counts.pets}</h2>
                      <IonCardSubtitle color="light">Pets</IonCardSubtitle>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                
                <IonCol size="6" sizeMd="4">
                  <IonCard button onClick={() => setActiveSegment('products')} color="tertiary">
                    <IonCardContent className="ion-text-center">
                      <IonIcon icon={basket} color="light" style={{ fontSize: '2rem' }} />
                      <h2 className="stat-value">{stats.counts.products}</h2>
                      <IonCardSubtitle color="light">Products</IonCardSubtitle>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                
                <IonCol size="6" sizeMd="4">
                  <IonCard button onClick={() => setActiveSegment('reports')} color="danger">
                    <IonCardContent className="ion-text-center">
                      <IonIcon icon={warning} color="light" style={{ fontSize: '2rem' }} />
                      <h2 className="stat-value">{stats.pending.reports}</h2>
                      <IonCardSubtitle color="light">Pending Reports</IonCardSubtitle>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                
                <IonCol size="6" sizeMd="4">
                  <IonCard button onClick={() => setActiveSegment('pets')} color="warning">
                    <IonCardContent className="ion-text-center">
                      <IonIcon icon={heart} color="light" style={{ fontSize: '2rem' }} />
                      <h2 className="stat-value">{stats.pending.adoptions}</h2>
                      <IonCardSubtitle color="light">Pending Adoptions</IonCardSubtitle>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                
                <IonCol size="6" sizeMd="4">
                  <IonCard button routerLink="/messages" color="secondary">
                    <IonCardContent className="ion-text-center">
                      <IonIcon icon={chatbubbleEllipses} color="light" style={{ fontSize: '2rem' }} />
                      <h2 className="stat-value">{stats.pending.messages}</h2>
                      <IonCardSubtitle color="light">Unread Messages</IonCardSubtitle>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
              
              {/* Recent Activities */}
              <IonRow className="ion-margin-top">
                <IonCol size="12" sizeMd="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>Recent Adoption Requests</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      {recentAdoptions.length > 0 ? (
                        <IonList lines="full">
                          {recentAdoptions.map(adoption => (
                            <IonItem key={adoption.id} button routerLink={`/adoptions/${adoption.id}`}>
                              <IonLabel>
                                <h2>{adoption.pet.name} ({adoption.pet.species})</h2>
                                <p>By: {adoption.user.name}</p>
                                <p>{formatDate(adoption.createdAt)}</p>
                              </IonLabel>
                              <IonChip slot="end" color={getStatusColor(adoption.status)}>
                                {adoption.status}
                              </IonChip>
                            </IonItem>
                          ))}
                        </IonList>
                      ) : (
                        <div className="ion-text-center ion-padding">
                          <IonText color="medium">No recent adoption requests</IonText>
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                
                <IonCol size="12" sizeMd="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>Recent Reports</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      {recentReports.length > 0 ? (
                        <IonList lines="full">
                          {recentReports.map(report => (
                            <IonItem key={report.id} button routerLink={`/reports/${report.id}`}>
                              <IonLabel>
                                <h2>{report.title}</h2>
                                <p>By: {report.user.name}</p>
                                <p>{formatDate(report.createdAt)}</p>
                              </IonLabel>
                              <IonChip slot="end" color={getStatusColor(report.status)}>
                                <IonIcon icon={getStatusIcon(report.status)} />
                                <IonLabel>{report.status}</IonLabel>
                              </IonChip>
                            </IonItem>
                          ))}
                        </IonList>
                      ) : (
                        <div className="ion-text-center ion-padding">
                          <IonText color="medium">No recent reports</IonText>
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
              
              {/* Inventory Status */}
              {inventoryStatus && (
                <IonRow className="ion-margin-top">
                  <IonCol size="12">
                    <IonCard>
                      <IonCardHeader>
                        <IonCardTitle>Inventory Alert</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        {inventoryStatus.lowStockProducts.length > 0 ? (
                          <div>
                            <IonText color="medium">
                              <p>Products with low stock (less than 10 items)</p>
                            </IonText>
                            <IonList lines="full">
                              {inventoryStatus.lowStockProducts.map(product => (
                                <IonItem key={product.id} button routerLink={`/products/${product.id}`}>
                                  <IonLabel>
                                    <h2>{product.name}</h2>
                                    <p>Category: {product.category}</p>
                                    <p>Price: ${Number(product?.price ?? 0).toFixed(2)}</p>
                                  </IonLabel>
                                  <IonBadge slot="end" color={product.stock < 3 ? 'danger' : 'warning'}>
                                    {product.stock} left
                                  </IonBadge>
                                </IonItem>
                              ))}
                            </IonList>
                          </div>
                        ) : (
                          <div className="ion-text-center ion-padding">
                            <IonText color="success">
                              <p>All products are well-stocked</p>
                            </IonText>
                          </div>
                        )}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </div>
        )}
        
        {/* Users Management Section */}
        {activeSegment === 'users' && (
          <UserManagement />
        )}
        
        {/* Pets Management Section */}
        {activeSegment === 'pets' && (
          <PetManagement />
        )}
        
        {/* Products Management Section */}
        {activeSegment === 'products' && (
          <ProductManagement />
        )}
        
        {/* Reports Management Section */}
        {activeSegment === 'reports' && (
          <ReportManagement />
        )}
        
        {/* Messages Management Section */}
        {activeSegment === 'messages' && (
          <MessageManagement />
        )}
        
      </IonContent>
    </IonPage>
  );
};

export default Admin;