import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonLoading,
  IonNote,
  IonPage,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  call,
  location,
  lockClosed,
  logOut,
  paw,
  person,
  save,
  warning
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePets } from '../contexts/PetContext';
import { useReports } from '../contexts/ReportContext';
import "./Profile.css";
const Profile: React.FC = () => {
  const { user, isLoading: authLoading, error: authError, logout, updateProfile, changePassword, isLoggedIn } = useAuth();
  const { adoptionApplications, fetchUserAdoptionApplications, isLoading: petsLoading } = usePets();
  const { userReports, fetchUserReports, isLoading: reportsLoading } = useReports();
  
  const [activeSegment, setActiveSegment] = useState<string>('info');
  
  const [profileData, setProfileData] = useState({
    username: '',
    fullName: '',
    phone: '',
    address: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [updateSuccess, setUpdateSuccess] = useState({
    profile: false,
    password: false
  });
  
  // Update profile form when user data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);
  
  // Fetch user's adoption applications and reports when component mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoggedIn()) {
      fetchUserAdoptionApplications(user?.id!);
      fetchUserReports();
    }
  }, [user,fetchUserAdoptionApplications,fetchUserReports,isLoggedIn]);
  // If user is not logged in, redirect to login
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }
  
  
  const handleProfileChange = (e: CustomEvent) => {
    const { name, value } = e.detail;
    setProfileData({
      ...profileData,
      [name]: value
    });
    // Clear success message when user starts typing
    if (updateSuccess.profile) {
      setUpdateSuccess({
        ...updateSuccess,
        profile: false
      });
    }
  };
  
  const handlePasswordChange = (e: CustomEvent) => {
    const { name, value } = e.detail;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Clear errors when user types
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
    
    // Clear success message when user starts typing
    if (updateSuccess.password) {
      setUpdateSuccess({
        ...updateSuccess,
        password: false
      });
    }
  };
  
  const validatePassword = () => {
    let isValid = true;
    const errors = {
      newPassword: '',
      confirmPassword: ''
    };
    
    // Check password length
    if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setPasswordErrors(errors);
    return isValid;
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileData);

      setUpdateSuccess({
        ...updateSuccess,
        profile: true
      });
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
      setUpdateSuccess({
        ...updateSuccess,
        password: true
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>My Profile</IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={handleLogout}>
            <IonIcon slot="icon-only" icon={logOut} />
          </IonButton>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeSegment} onIonChange={e => setActiveSegment(e.detail.value as string)}>
            <IonSegmentButton value="info">
              <IonLabel>Profile</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="applications">
              <IonLabel>Adoptions</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="reports">
              <IonLabel>Reports</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {activeSegment === 'info' && (
          <div>
            <IonCard>
              <IonCardHeader>
                <div className="profile-header">
                  <IonAvatar className="profile-avatar">
                    <img src="/assets/avatar-placeholder.png" alt="Profile" />
                  </IonAvatar>
                  <div className="profile-details">
                    <h2>{user?.fullName || user?.username}</h2>
                    <p>{user?.email}</p>
                    <IonBadge color={user?.role === 'admin' ? 'danger' : 'primary'}>
                      {user?.role === 'admin' ? 'Administrator' : 'Member'}
                    </IonBadge>
                  </div>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <div className="profile-stat">
                        <div className="stat-number">{adoptionApplications?.length || 0}</div>
                        <div className="stat-label">Adoptions</div>
                      </div>
                    </IonCol>
                    <IonCol size="6">
                      <div className="profile-stat">
                        <div className="stat-number">{userReports?.length || 0}</div>
                        <div className="stat-label">Reports</div>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
            
            <IonItemDivider>Update Profile</IonItemDivider>
            
            <form onSubmit={handleProfileSubmit}>
              <IonList>
                <IonItem>
                  <IonIcon icon={person} slot="start" color="primary" />
                  <IonLabel position="floating">Username</IonLabel>
                  <IonInput
                    name="username"
                    value={profileData.username}
                    onIonChange={handleProfileChange}
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={person} slot="start" color="primary" />
                  <IonLabel position="floating">Full Name</IonLabel>
                  <IonInput
                    name="fullName"
                    value={profileData.fullName}
                    onIonChange={handleProfileChange}
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={call} slot="start" color="primary" />
                  <IonLabel position="floating">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onIonChange={handleProfileChange}
                  />
                </IonItem>
                
                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={location} slot="start" color="primary" />
                  <IonLabel position="floating">Address</IonLabel>
                  <IonInput
                    name="address"
                    value={profileData.address}
                    onIonChange={handleProfileChange}
                  />
                </IonItem>
              </IonList>
              
              {updateSuccess.profile && (
                <IonText color="success">
                  <p className="ion-text-center">Profile updated successfully!</p>
                </IonText>
              )}
              
              {authError && activeSegment === 'info' && (
                <IonText color="danger">
                  <p className="ion-text-center">{authError}</p>
                </IonText>
              )}
              
              <IonButton
                expand="block"
                type="submit"
                color="primary"
                disabled={authLoading}
              >
                <IonIcon slot="start" icon={save} />
                Save Profile
              </IonButton>
            </form>
            
            <IonItemDivider className="ion-margin-top">Change Password</IonItemDivider>
            
            <form onSubmit={handlePasswordSubmit}>
              <IonList>
                <IonItem>
                  <IonIcon icon={lockClosed} slot="start" color="primary" />
                  <IonLabel position="floating">Current Password</IonLabel>
                  <IonInput
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onIonChange={handlePasswordChange}
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={lockClosed} slot="start" color="primary" />
                  <IonLabel position="floating">New Password</IonLabel>
                  <IonInput
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onIonChange={handlePasswordChange}
                    required
                  />
                  {passwordErrors.newPassword && (
                    <IonNote slot="helper" color="danger">
                      {passwordErrors.newPassword}
                    </IonNote>
                  )}
                </IonItem>
                
                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={lockClosed} slot="start" color="primary" />
                  <IonLabel position="floating">Confirm New Password</IonLabel>
                  <IonInput
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onIonChange={handlePasswordChange}
                    required
                  />
                  {passwordErrors.confirmPassword && (
                    <IonNote slot="helper" color="danger">
                      {passwordErrors.confirmPassword}
                    </IonNote>
                  )}
                </IonItem>
              </IonList>
              
              {updateSuccess.password && (
                <IonText color="success">
                  <p className="ion-text-center">Password updated successfully!</p>
                </IonText>
              )}
              
              <IonButton
                expand="block"
                type="submit"
                color="primary"
                disabled={
                  authLoading ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
              >
                <IonIcon slot="start" icon={save} />
                Change Password
              </IonButton>
            </form>
          </div>
        )}
        
        {activeSegment === 'applications' && (
          <div>
            <div className="section-header">
              <h2>My Adoption Applications</h2>
            </div>
            
            {petsLoading ? (
              <div className="loading-container">
                <IonLoading isOpen={true} message="Loading applications..." />
              </div>
            ) : adoptionApplications && adoptionApplications.length > 0 ? (
              <IonList>
                {adoptionApplications.map((application) => (
                  <IonCard key={application.id} routerLink={`/pets/${application.petId}`}>
                    <IonCardContent>
                      <div className="application-item">
                        <div className="application-pet-info">
                          <div className="application-pet-image">
                            {application.pet && application.pet.imageUrl ? (
                              <img src={application.pet.imageUrl} alt={application.pet.name} />
                            ) : (
                              <div className="placeholder-image">
                                <IonIcon icon={paw} />
                              </div>
                            )}
                          </div>
                          <div className="application-pet-details">
                            <h3>{application.pet ? application.pet.name : 'Pet'}</h3>
                            <p>{application.pet ? `${application.pet.species}, ${application.pet.breed || 'Mixed Breed'}` : 'Unknown'}</p>
                            <IonBadge color={getStatusColor(application.status)}>
                              {application.status}
                            </IonBadge>
                          </div>
                        </div>
                        <div className="application-date">
                          <IonText color="medium">
                            <small>Applied on {new Date(application.createdAt).toLocaleDateString()}</small>
                          </IonText>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            ) : (
              <div className="empty-state">
                <IonIcon icon={paw} color="medium" />
                <IonText color="medium">You haven't applied to adopt any pets yet.</IonText>
                <IonButton routerLink="/pets" color="primary">
                  Browse Pets
                </IonButton>
              </div>
            )}
          </div>
        )}
        
        {activeSegment === 'reports' && (
          <div>
            <div className="section-header">
              <h2>My Reports</h2>
            </div>
            
            {reportsLoading ? (
              <div className="loading-container">
                <IonLoading isOpen={true} message="Loading reports..." />
              </div>
            ) : userReports && userReports.length > 0 ? (
              <IonList>
                {userReports.map((report) => (
                  <IonCard key={ report.id} routerLink={`/report/${ report.id}`}>
                    <IonCardContent>
                      <div className="report-item">
                        <div className="report-content">
                          <h3>{ report.title}</h3>
                          <p className="report-description">{ report.description}</p>
                          <div className="report-meta">
                            <IonBadge color={
                               report.status === 'resolved' ? 'success' :
                               report.status === 'reviewing' ? 'warning' : 'medium'
                            }>
                              { report.status}
                            </IonBadge>
                            <IonText color="medium">
                              <small>{new Date( report.createdAt).toLocaleDateString()}</small>
                            </IonText>
                          </div>
                        </div>
                        { report.imageUrl && (
                          <div className=" report-image">
                            <img src={ report.imageUrl} alt="Report evidence" />
                          </div>
                        )}
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            ) : (
              <div className="empty-state">
                <IonIcon icon={warning} color="medium" />
                <IonText color="medium">You haven't submitted any reports yet.</IonText>
                <IonButton routerLink="/report" color="danger">
                  Report Animal Cruelty
                </IonButton>
              </div>
            )}
          </div>
        )}
      </IonContent>
     
    </IonPage>
  );
};

export default Profile;