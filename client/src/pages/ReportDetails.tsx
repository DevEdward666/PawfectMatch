import {
  IonAvatar,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  alertCircleOutline,
  calendar,
  checkmarkCircle,
  hourglassOutline,
  location,
  person,
  send,
  time
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportContext';
import { ReportResponseForm } from '../models/report.model';

interface ReportDetailParams {
  id: string;
}

const ReportDetail: React.FC = () => {
  const { currentReport, fetchReportById, updateReportStatus, respondToReport, isLoading, error } = useReports();
  const { isLoggedIn, isAdmin } = useAuth();
  const { id } = useParams<ReportDetailParams>();
  
  const [responseContent, setResponseContent] = useState<string>('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoggedIn()) {
      fetchReportById(parseInt(id));
    }
  }, [id,fetchReportById,isLoggedIn]);
  
  const handleStatusChange = async (status: 'pending' | 'reviewing' | 'resolved') => {
    await updateReportStatus(parseInt(id), status);
  };
  
  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!responseContent.trim()) {
      return;
    }
    
    const responseData: ReportResponseForm = {
      content: responseContent
    };
    
    await respondToReport(parseInt(id), responseData);
    setResponseContent('');
  };
  
  const handleResponseChange = (e: CustomEvent) => {
    setResponseContent(e.detail.value);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'reviewing':
        return 'warning';
      case 'pending':
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
      default:
        return hourglassOutline;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/report" />
          </IonButtons>
          <IonTitle>Report Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={true} message="Loading report details..." />
        ) : error ? (
          <div className="ion-text-center ion-padding">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton routerLink="/report">Back to Reports</IonButton>
          </div>
        ) : currentReport ? (
          <div>
            <IonCard>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <IonCardTitle>{currentReport.title}</IonCardTitle>
                  <IonChip color={getStatusColor(currentReport.status)}>
                    <IonIcon icon={getStatusIcon(currentReport.status)} />
                    <IonLabel>{currentReport.status.charAt(0).toUpperCase() + currentReport.status.slice(1)}</IonLabel>
                  </IonChip>
                </div>
                
                <div className="report-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  <IonText color="medium" style={{ display: 'flex', alignItems: 'center' }}>
                    <IonIcon icon={calendar} style={{ marginRight: '4px' }} />
                    <small>{formatDate(currentReport.createdAt)}</small>
                  </IonText>
                  <IonText color="medium" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
                    <IonIcon icon={time} style={{ marginRight: '4px' }} />
                    <small>{formatTime(currentReport.createdAt)}</small>
                  </IonText>
                  {currentReport.user && (
                    <IonText color="medium" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
                      <IonIcon icon={person} style={{ marginRight: '4px' }} />
                      <small>{currentReport.user.fullName || currentReport.user.username}</small>
                    </IonText>
                  )}
                </div>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <p>{currentReport.description}</p>
                </IonText>
                
                {currentReport.location && (
                  <div className="location-info ion-margin-top">
                    <IonItem lines="none">
                      <IonIcon icon={location} slot="start" color="medium" />
                      <IonLabel>
                        <h3>Location</h3>
                        <p>{currentReport.location}</p>
                      </IonLabel>
                    </IonItem>
                  </div>
                )}
                
                {currentReport.imageUrl && (
                  <div className="evidence-photo ion-margin-top ion-padding-top">
                    <IonText color="medium">
                      <h3>Evidence Photo</h3>
                    </IonText>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <img 
                        src={currentReport.imageUrl} 
                        alt="Report evidence" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '300px',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {isAdmin() && (
                  <div className="admin-actions ion-margin-top ion-padding-top">
                    <IonText color="medium">
                      <h3>Update Status</h3>
                    </IonText>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <IonButton 
                        color="medium" 
                        fill={currentReport.status === 'pending' ? 'solid' : 'outline'}
                        onClick={() => handleStatusChange('pending')}
                      >
                        Pending
                      </IonButton>
                      <IonButton 
                        color="warning" 
                        fill={currentReport.status === 'reviewing' ? 'solid' : 'outline'}
                        onClick={() => handleStatusChange('reviewing')}
                      >
                        Reviewing
                      </IonButton>
                      <IonButton 
                        color="success" 
                        fill={currentReport.status === 'resolved' ? 'solid' : 'outline'}
                        onClick={() => handleStatusChange('resolved')}
                      >
                        Resolved
                      </IonButton>
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
            
            {/* Responses Section */}
            <div className="responses-section ion-margin-top">
              <h2>Responses</h2>
              
              {currentReport.responses && currentReport.responses.length > 0 ? (
                <IonList>
                  {currentReport.responses?.map(response => (
                    <IonCard key={response.id} className="ion-margin-vertical">
                      <IonCardContent>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <IonAvatar style={{ width: '36px', height: '36px', marginRight: '12px' }}>
                            <div style={{ 
                              backgroundColor: '#6200ea', 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {response.user && response.user.username ? response.user.username.charAt(0).toUpperCase() : 'A'}
                            </div>
                          </IonAvatar>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>{response.user ? (response.user.fullName || response.user.username) : 'Admin'}</strong>
                                {response.user && response.user.role === 'admin' && (
                                  <IonBadge color="danger" style={{ marginLeft: '8px' }}>Admin</IonBadge>
                                )}
                              </div>
                              <IonText color="medium">
                                <small>{formatDate(response.createdAt)}</small>
                              </IonText>
                            </div>
                            <IonText>
                              <p style={{ marginTop: '8px' }}>{response.content}</p>
                            </IonText>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              ) : (
                <div className="ion-text-center ion-padding">
                  <IonText color="medium">
                    <p>No responses yet.</p>
                  </IonText>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ion-text-center ion-padding">
            <IonText color="medium">
              <p>Report not found.</p>
            </IonText>
            <IonButton routerLink="/report">Back to Reports</IonButton>
          </div>
        )}
      </IonContent>
      
      {/* Response Form */}
      {currentReport && (
        <IonFooter>
          <IonToolbar>
            <form onSubmit={handleResponseSubmit} style={{ display: 'flex', padding: '8px 16px' }}>
              <IonInput
                placeholder="Add a response..."
                value={responseContent}
                onIonChange={handleResponseChange}
                style={{ 
                  '--padding-start': '12px',
                  '--padding-end': '12px',
                  '--padding-top': '8px',
                  '--padding-bottom': '8px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  flex: 1
                }}
              />
              <IonButton 
                type="submit" 
                fill="clear" 
                disabled={!responseContent.trim()}
                style={{ marginLeft: '8px' }}
              >
                <IonIcon icon={send} />
              </IonButton>
            </form>
          </IonToolbar>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default ReportDetail;