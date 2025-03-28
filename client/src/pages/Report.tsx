import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonLoading,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonList,
  IonThumbnail,
  IonImg,
  IonChip,
  IonSegment,
  IonSegmentButton,
  useIonActionSheet
} from '@ionic/react';
import {
  warning,
  images,
  location,
  camera,
  documentText,
  send,
  refresh,
  trash,
  checkmarkCircle,
  hourglassOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useReports } from '../contexts/ReportContext';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { Redirect } from 'react-router-dom';
import { ReportForm } from '../models/report.model';

const Report: React.FC = () => {
  const { userReports, submitReport, fetchUserReports, isLoading, error } = useReports();
  const { isLoggedIn, isAdmin } = useAuth();
  const { takePhoto } = usePhotoGallery();
  const [presentActionSheet] = useIonActionSheet();
  
  const [activeSegment, setActiveSegment] = useState<string>('new');
  
  const [formData, setFormData] = useState<ReportForm>({
    title: '',
    description: '',
    location: '',
    image: undefined
  });
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Load user's reports on component mount
  useEffect(() => {
    if (isLoggedIn()) {
      fetchUserReports();
    }
  }, []);
  
  // If user is not logged in, redirect to login page
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }
  
  const handleInputChange = (e: CustomEvent) => {
    const { name, value } = e.detail;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleImageUpload = async () => {
    presentActionSheet({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: camera,
          handler: () => captureImage()
        },
        {
          text: 'Choose from Gallery',
          icon: images,
          handler: () => selectImage()
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };
  
  const captureImage = async () => {
    try {
      const photo = await takePhoto();
      if (photo) {
        const file = await convertBlobToFile(photo.webviewPath!);
        if (file) {
          setFormData({
            ...formData,
            image: file
          });
          setPreviewImage(photo.webviewPath!);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };
  
  const selectImage = async () => {
    try {
      // This would be implemented with file browser, but here we'll use camera for simplicity
      const photo = await takePhoto();
      if (photo) {
        const file = await convertBlobToFile(photo.webviewPath!);
        if (file) {
          setFormData({
            ...formData,
            image: file
          });
          setPreviewImage(photo.webviewPath!);
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
    }
  };
  
  const convertBlobToFile = async (blobUrl: string): Promise<File | null> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new File([blob], 'report-image.jpg', { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting blob to file:', error);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.description) {
      // Show error message
      return;
    }
    
    await submitReport(formData);
    
    // Reset form if successful
    if (!error) {
      setFormData({
        title: '',
        description: '',
        location: '',
        image: undefined
      });
      setPreviewImage(null);
    }
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Report Animal Cruelty</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeSegment} onIonChange={e => setActiveSegment(e.detail.value as string)}>
            <IonSegmentButton value="new">
              <IonLabel>New Report</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="my">
              <IonLabel>My Reports</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* New Report Form */}
        {activeSegment === 'new' && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="ion-text-center">
                <IonIcon icon={warning} color="danger" style={{ fontSize: '2rem' }} />
                <h2>Report Animal Cruelty</h2>
                <p>
                  <IonText color="medium">Help us protect animals by reporting any incident of animal cruelty or neglect.</IonText>
                </p>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleSubmit}>
                {error && (
                  <IonItem lines="none">
                    <IonText color="danger">{error}</IonText>
                  </IonItem>
                )}
                
                <IonItem>
                  <IonLabel position="floating">Title*</IonLabel>
                  <IonInput 
                    name="title" 
                    value={formData.title} 
                    onIonChange={handleInputChange} 
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="floating">Description*</IonLabel>
                  <IonTextarea 
                    name="description" 
                    value={formData.description} 
                    onIonChange={handleInputChange} 
                    rows={4}
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon slot="start" icon={location} />
                  <IonLabel position="floating">Location</IonLabel>
                  <IonInput 
                    name="location" 
                    value={formData.location} 
                    onIonChange={handleInputChange} 
                    placeholder="e.g. 123 Main St, City, State"
                  />
                </IonItem>
                
                <IonItem lines="none" className="ion-margin-bottom">
                  <IonLabel>Evidence Photo</IonLabel>
                  <IonButton 
                    slot="end" 
                    onClick={handleImageUpload} 
                    fill="clear"
                    color="medium"
                  >
                    <IonIcon slot="start" icon={camera} />
                    Upload
                  </IonButton>
                </IonItem>
                
                {previewImage && (
                  <div className="ion-margin-bottom" style={{ 
                    display: 'flex', 
                    justifyContent: 'center' 
                  }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={previewImage} 
                        alt="Report image" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          borderRadius: '8px'
                        }} 
                      />
                      <IonButton 
                        fill="clear" 
                        color="danger"
                        size="small"
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0,
                          margin: 0,
                          '--padding-start': '4px',
                          '--padding-end': '4px'
                        }}
                        onClick={() => {
                          setPreviewImage(null);
                          setFormData({
                            ...formData,
                            image: undefined
                          });
                        }}
                      >
                        <IonIcon icon={trash} />
                      </IonButton>
                    </div>
                  </div>
                )}
                
                <div className="ion-margin-top">
                  <IonText color="medium" className="ion-margin-bottom">
                    <p>
                      <small>
                        Your report will be kept confidential and will be reviewed by our team. We may contact you for more information if needed.
                      </small>
                    </p>
                  </IonText>
                </div>
                
                <IonButton 
                  expand="block" 
                  type="submit" 
                  color="danger"
                  className="ion-margin-top"
                  disabled={isLoading || !formData.title || !formData.description}
                >
                  <IonIcon slot="start" icon={send} />
                  Submit Report
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>
        )}
        
        {/* My Reports List */}
        {activeSegment === 'my' && (
          <div>
            <div className="ion-padding-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>My Reports</h2>
              <IonButton 
                fill="clear" 
                onClick={() => fetchUserReports()}
              >
                <IonIcon slot="icon-only" icon={refresh} />
              </IonButton>
            </div>
            
            {userReports.length === 0 ? (
              <div className="ion-text-center ion-padding">
                <IonIcon icon={documentText} color="medium" style={{ fontSize: '3rem' }} />
                <p>You haven't submitted any reports yet.</p>
                <IonButton 
                  color="danger" 
                  onClick={() => setActiveSegment('new')}
                >
                  Create New Report
                </IonButton>
              </div>
            ) : (
              <IonList>
                {userReports.map(report => (
                  <IonCard key={report.id} routerLink={`/reports/${report.id}`}>
                    <div style={{ display: 'flex', padding: '12px 16px' }}>
                      {report.imageUrl ? (
                        <IonThumbnail slot="start" style={{ marginRight: '16px' }}>
                          <IonImg src={report.imageUrl} alt="Report evidence" />
                        </IonThumbnail>
                      ) : (
                        <div style={{ 
                          width: '56px', 
                          height: '56px', 
                          backgroundColor: '#f4f4f4', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          marginRight: '16px',
                          borderRadius: '4px'
                        }}>
                          <IonIcon icon={warning} color="danger" />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0' }}>{report.title}</h3>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {report.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <IonChip color={getStatusColor(report.status)} outline={true} style={{ margin: 0 }}>
                            <IonIcon icon={getStatusIcon(report.status)} />
                            <IonLabel>{report.status.charAt(0).toUpperCase() + report.status.slice(1)}</IonLabel>
                          </IonChip>
                          <IonText color="medium">
                            <small>
                              {new Date(report.createdAt).toLocaleDateString()}
                            </small>
                          </IonText>
                        </div>
                      </div>
                    </div>
                  </IonCard>
                ))}
              </IonList>
            )}
          </div>
        )}
        
        <IonLoading isOpen={isLoading} message="Please wait..." />
      </IonContent>
    </IonPage>
  );
};

export default Report;