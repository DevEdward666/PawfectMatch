import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
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
import { formatDistanceToNow } from 'date-fns';
import {
  alertCircleOutline,
  chatbubbleEllipses,
  checkmarkCircle,
  closeOutline,
  ellipsisVertical,
  eyeOutline,
  filterOutline,
  hourglassOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useReports } from '../../contexts/ReportContext';
import { Report } from '../../models/report.model';

const ReportManagement: React.FC = () => {
  const {
    reports,
    currentReport,
    isLoading,
    fetchAllReports,
    fetchReportById,
    updateReportStatus,
    respondToReport
  } = useReports();
  
  const [present] = useIonActionSheet();
  const [presentToast] = useIonToast();
  
  // State variables
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showReportDetailModal, setShowReportDetailModal] = useState<boolean>(false);
  const [showResponseModal, setShowResponseModal] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [responseContent, setResponseContent] = useState<string>('');
  
  // Effects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadReports();
  }, []);
  
  // Functions
  const loadReports = async () => {
    await fetchAllReports();
  };
  
  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value!);
  };
  
  const handleStatusChange = async (reportId: number, newStatus: 'pending' | 'reviewing' | 'resolved') => {
    try {
      await updateReportStatus(reportId, newStatus);
      presentToast({
        message: `Report status updated to ${newStatus}`,
        duration: 3000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      presentToast({
        message: 'Error updating report status',
        duration: 3000,
        color: 'danger'
      });
    }
  };
  
  const openReportDetail = async (report: Report) => {
    setSelectedReport(report);
    await fetchReportById(report.id);
    setShowReportDetailModal(true);
  };
  
  const openResponseModal = (report: Report) => {
    setSelectedReport(report);
    setResponseContent('');
    setShowResponseModal(true);
  };
  
  const handleSubmitResponse = async () => {
    if (!selectedReport || !responseContent.trim()) {
      presentToast({
        message: 'Response content cannot be empty',
        duration: 3000,
        color: 'danger'
      });
      return;
    }
    
    try {
      await respondToReport(selectedReport.id, { content: responseContent });
      presentToast({
        message: 'Response submitted successfully',
        duration: 3000,
        color: 'success'
      });
      setShowResponseModal(false);
      // Refresh report details
      await fetchReportById(selectedReport.id);
    } catch (error) {
      console.error('Error submitting response:', error);
      presentToast({
        message: 'Error submitting response',
        duration: 3000,
        color: 'danger'
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'reviewing':
        return 'warning';
      case 'pending':
        return 'medium';
      default:
        return 'medium';
    }
  };
  
  const showOptions = (report: Report) => {
    present({
      header: 'Actions',
      buttons: [
        {
          text: 'View Details',
          icon: eyeOutline,
          handler: () => openReportDetail(report)
        },
        {
          text: 'Add Response',
          icon: chatbubbleEllipses,
          handler: () => openResponseModal(report)
        },
        {
          text: 'Mark as Pending',
          icon: hourglassOutline,
          handler: () => handleStatusChange(report.id, 'pending'),
          cssClass: report.status === 'pending' ? 'action-sheet-button-disabled' : ''
        },
        {
          text: 'Mark as Reviewing',
          icon: alertCircleOutline,
          handler: () => handleStatusChange(report.id, 'reviewing'),
          cssClass: report.status === 'reviewing' ? 'action-sheet-button-disabled' : ''
        },
        {
          text: 'Mark as Resolved',
          icon: checkmarkCircle,
          handler: () => handleStatusChange(report.id, 'resolved'),
          cssClass: report.status === 'resolved' ? 'action-sheet-button-disabled' : ''
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };
  
  // Filtering reports
  const filteredReports = reports
    .filter(report => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          report.title.toLowerCase().includes(searchLower) ||
          report.description.toLowerCase().includes(searchLower) ||
          report.user?.fullName?.toLowerCase().includes(searchLower) ||
          report.location?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(report => {
      // Status filter
      if (statusFilter !== 'all') {
        return report.status === statusFilter;
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
                    <div>Report Management</div>
                    <div>
                      <IonButton fill="clear" onClick={() => setShowFilter(!showFilter)}>
                        <IonIcon icon={filterOutline} />
                      </IonButton>
                      <IonButton fill="clear" onClick={loadReports}>
                        <IonIcon icon={refreshOutline} />
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
                        <IonCol size="12" sizeMd="6">
                          <IonSearchbar
                            value={searchText}
                            onIonChange={handleSearch}
                            placeholder="Search reports"
                          />
                        </IonCol>
                        
                        <IonCol size="12" sizeMd="6">
                          <IonItem>
                            <IonLabel>Status</IonLabel>
                            <IonSelect 
                              value={statusFilter} 
                              onIonChange={e => setStatusFilter(e.detail.value)}
                            >
                              <IonSelectOption value="all">All</IonSelectOption>
                              <IonSelectOption value="pending">Pending</IonSelectOption>
                              <IonSelectOption value="reviewing">Reviewing</IonSelectOption>
                              <IonSelectOption value="resolved">Resolved</IonSelectOption>
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
                    <p>Loading reports...</p>
                  </div>
                )}
                
                {!isLoading && filteredReports.length === 0 && (
                  <div className="ion-text-center ion-padding">
                    <IonText color="medium">
                      <p>No reports found. Try adjusting your filters.</p>
                    </IonText>
                  </div>
                )}
                
                {!isLoading && filteredReports.length > 0 && (
                  <IonList>
                    {filteredReports.map(report => (
                      <IonItem key={report.id} className="ion-margin-bottom">
                        <IonAvatar slot="start">
                          <div style={{ 
                            backgroundColor: '#f4f5f8', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            width: '100%',
                            height: '100%'
                          }}>
                            <IonIcon icon={getStatusIcon(report.status)} color={getStatusColor(report.status)} />
                          </div>
                        </IonAvatar>
                        
                        <IonLabel>
                          <h2>{report.title}</h2>
                          <p>
                            <strong>By:</strong> {report.user?.fullName || 'Anonymous'}
                          </p>
                          <p>
                            {report.description.substring(0, 60)}
                            {report.description.length > 60 ? '...' : ''}
                          </p>
                          <p className="ion-text-end" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                            {formatDate(report.createdAt)}
                          </p>
                        </IonLabel>
                        
                        <IonChip 
                          color={getStatusColor(report.status)}
                          slot="end"
                        >
                          <IonIcon icon={getStatusIcon(report.status)} />
                          <IonLabel>{report.status}</IonLabel>
                        </IonChip>
                        
                        <IonButton fill="clear" slot="end" onClick={() => showOptions(report)}>
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
      
      {/* Report Detail Modal */}
      <IonModal isOpen={showReportDetailModal} onDidDismiss={() => setShowReportDetailModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Report Details</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowReportDetailModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          {!currentReport && (
            <div className="ion-text-center ion-padding">
              <IonSpinner />
              <p>Loading report details...</p>
            </div>
          )}
          
          {currentReport && (
            <div>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{currentReport.title}</IonCardTitle>
                  <div className="ion-padding-top">
                    <IonChip color={getStatusColor(currentReport.status)}>
                      <IonIcon icon={getStatusIcon(currentReport.status)} />
                      <IonLabel>{currentReport.status}</IonLabel>
                    </IonChip>
                  </div>
                </IonCardHeader>
                
                <IonCardContent>
                  <p><strong>Reported by:</strong> {currentReport.user?.fullName || 'Anonymous'}</p>
                  <p><strong>Date reported:</strong> {new Date(currentReport.createdAt).toLocaleString()}</p>
                  {currentReport.location && (
                    <p><strong>Location:</strong> {currentReport.location}</p>
                  )}
                  
                  <div className="ion-margin-top ion-margin-bottom">
                    <IonText>
                      <h3>Description</h3>
                      <p>{currentReport.description}</p>
                    </IonText>
                  </div>
                  
                  {currentReport.imageUrl && (
                    <div className="ion-margin-top ion-margin-bottom">
                      <IonText>
                        <h3>Attached Image</h3>
                      </IonText>
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={currentReport.imageUrl} 
                          alt="Report" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px', 
                            borderRadius: '8px' 
                          }} 
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="ion-margin-top">
                    <IonText>
                      <h3>Actions</h3>
                    </IonText>
                    <div className="ion-margin-top ion-padding-bottom">
                      <IonButton
                        expand="block"
                        color="warning"
                        disabled={currentReport.status === 'reviewing'}
                        onClick={() => handleStatusChange(currentReport.id, 'reviewing')}
                      >
                        <IonIcon slot="start" icon={alertCircleOutline} />
                        Mark as Reviewing
                      </IonButton>
                      
                      <IonButton 
                        expand="block"
                        color="success"
                        disabled={currentReport.status === 'resolved'}
                        onClick={() => handleStatusChange(currentReport.id, 'resolved')}
                      >
                        <IonIcon slot="start" icon={checkmarkCircle} />
                        Mark as Resolved
                      </IonButton>
                      
                      <IonButton 
                        expand="block"
                        color="tertiary"
                        onClick={() => {
                          setShowReportDetailModal(false);
                          openResponseModal(currentReport);
                        }}
                      >
                        <IonIcon slot="start" icon={chatbubbleEllipses} />
                        Add Response
                      </IonButton>
                    </div>
                  </div>
                  
                  <div className="ion-margin-top">
                    <IonText>
                      <h3>Responses ({currentReport.responses?.length || 0})</h3>
                    </IonText>
                    
                    {(!currentReport.responses || currentReport.responses.length === 0) && (
                      <div className="ion-padding">
                        <IonText color="medium">
                          <p>No responses yet.</p>
                        </IonText>
                      </div>
                    )}
                    
                    {currentReport.responses && currentReport.responses.length > 0 && (
                      <IonList>
                        {currentReport.responses.map(response => (
                          <IonItem key={response.id}>
                            <IonLabel className="ion-text-wrap">
                              <h2>Response from {response.user?.fullName || 'Administrator'}</h2>
                              <p className="ion-margin-top ion-margin-bottom">{response.content}</p>
                              <p className="ion-text-end" style={{ fontSize: '0.8rem' }}>
                                {formatDate(response.createdAt)}
                              </p>
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonList>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>
      
      {/* Add Response Modal */}
      <IonModal isOpen={showResponseModal} onDidDismiss={() => setShowResponseModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add Response</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowResponseModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          {selectedReport && (
            <div>
              <IonText>
                <h3>Responding to: {selectedReport.title}</h3>
                <p className="ion-padding-bottom">
                  <small>Reported by {selectedReport.user?.fullName || 'Anonymous'}</small>
                </p>
              </IonText>
              
              <IonItem>
                <IonLabel position="stacked">Your Response</IonLabel>
                <IonTextarea
                  value={responseContent}
                  onIonChange={e => setResponseContent(e.detail.value!)}
                  placeholder="Enter your response to this report..."
                  rows={8}
                  required
                />
              </IonItem>
              
              <div className="ion-padding ion-text-center">
                <IonButton expand="block" onClick={handleSubmitResponse}>
                  Submit Response
                </IonButton>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </div>
  );
};

export default ReportManagement;