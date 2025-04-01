import React, { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonText,
  IonAlert,
  IonToast,
  IonChip,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonFab,
  IonFabButton,
  useIonActionSheet,
  IonThumbnail,
  IonAvatar,
  IonTextarea,
  IonInput,
  useIonToast,
  IonSpinner,
  IonPopover,
  IonLoading
} from '@ionic/react';
import {
  people,
  person,
  add,
  ellipsisVertical,
  trash,
  create,
  eyeOutline,
  filterOutline,
  refreshOutline,
  closeOutline,
  mailOutline,
  callOutline,
  homeOutline,
  shieldOutline,
  personCircleOutline,
  timeOutline
} from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';
import { User, RegisterRequest, UpdateProfileRequest } from '../../models/user.model';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

// We don't have a dedicated UserContext, so we'll fetch users directly with API here
const UserManagement: React.FC = () => {
  const { user: currentUser,token } = useAuth();
  
  const [present] = useIonActionSheet();
  const [presentToast] = useIonToast();
  
  // State variables
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState<boolean>(false);
  
  // Form state for new user (includes email and password)
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });
  
  // Password confirmation for new users
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [showRoleField, setShowRoleField] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  
  // Effects
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Functions
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/users/getAllUsers');
      setUsers(response.data.data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Failed to load users');
      presentToast({
        message: 'Error loading users',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value!);
  };
  
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      phone: '',
      address: ''
    });
    setPasswordConfirm('');
    setSelectedRole('user');
  };
  
  const openAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setShowRoleField(true);
    setIsModalOpen(true);
  };
  
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      name: user.fullName || '',
      phone: user.phone || '',
      address: user.address || '',
      password:""
    });
    setSelectedRole(user.role);
    setShowRoleField(true);
    setIsEditMode(true);
    setIsModalOpen(true);
  };
  
  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };
  
  const handleInputChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = (): boolean => {
    // Required fields validation
    if (!isEditMode && (!formData.username || !formData.email || !formData.password)) {
      presentToast({
        message: 'Username, email, and password are required',
        duration: 3000,
        color: 'danger'
      });
      return false;
    }
    
    if (isEditMode && (!formData.username || !formData.email)) {
      presentToast({
        message: 'Username and email are required',
        duration: 3000,
        color: 'danger'
      });
      return false;
    }
    
    // Password matching for new users
    if (!isEditMode && formData.password !== passwordConfirm) {
      presentToast({
        message: 'Passwords do not match',
        duration: 3000,
        color: 'danger'
      });
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      presentToast({
        message: 'Please enter a valid email address',
        duration: 3000,
        color: 'danger'
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit =  useCallback( async() => {
    if (!validateForm()) return;
    
    try {
      if (isEditMode && selectedUser) {
        // Update existing user
        const userData: UpdateProfileRequest & { role?: string } = {
          username: formData.username,
          fullName: formData.name,
          phone: formData.phone,
          address: formData.address,
          role: selectedRole
        };
        
        await api.put(`/users/update/${selectedUser.id}`, userData);
        presentToast({
          message: 'User updated successfully',
          duration: 3000,
          color: 'success'
        });
      } else {
        // Create new user
        const userData: RegisterRequest & { role: string } = {
          username: formData.username,
          email: formData.email,
          password: formData.password as string,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          role: selectedRole
        };
        
        await api.post('/users/create', userData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        presentToast({
          message: 'User created successfully',
          duration: 3000,
          color: 'success'
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      presentToast({
        message: error.response?.data?.message || 'Error processing your request',
        duration: 3000,
        color: 'danger'
      });
    }
  },[token,selectedUser,formData,selectedRole,isEditMode]);
  
  const confirmDelete = (user: User) => {
    // Prevent self-deletion
    if (currentUser && user.id === currentUser.id) {
      presentToast({
        message: 'You cannot delete your own account',
        duration: 3000,
        color: 'danger'
      });
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteAlert(true);
  };
  
  const handleDelete = async () => {
    if (userToDelete) {
      try {
        await api.delete(`/users/delete/${userToDelete.id}`);
        presentToast({
          message: 'User deleted successfully',
          duration: 3000,
          color: 'success'
        });
        loadUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        presentToast({
          message: error.response?.data?.message || 'Error deleting user',
          duration: 3000,
          color: 'danger'
        });
      }
    }
    setShowDeleteAlert(false);
    setUserToDelete(null);
  };
  
  const showOptions = (user: User) => {
    // Prevent self-deletion
    const isCurrentUser = currentUser && user.id === currentUser.id;
    
    present({
      header: 'Actions',
      buttons: [
        {
          text: 'View Details',
          icon: eyeOutline,
          handler: () => openUserDetail(user)
        },
        {
          text: 'Edit',
          icon: create,
          handler: () => openEditModal(user)
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: trash,
          handler: () => confirmDelete(user),
          cssClass: isCurrentUser ? 'action-sheet-button-disabled' : ''
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };
  
  // Filtering users
  const filteredUsers = users
    .filter(user => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower) ||
          user.address?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(user => {
      // Role filter
      if (roleFilter !== 'all') {
        return user.role === roleFilter;
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
                    <div>User Management</div>
                    <div>
                      <IonButton fill="clear" onClick={() => setShowFilter(!showFilter)}>
                        <IonIcon icon={filterOutline} />
                      </IonButton>
                      <IonButton fill="clear" onClick={loadUsers}>
                        <IonIcon icon={refreshOutline} />
                      </IonButton>
                      <IonButton onClick={openAddModal}>
                        <IonIcon icon={add} /> Add User
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
                            placeholder="Search users"
                          />
                        </IonCol>
                        
                        <IonCol size="12" sizeMd="6">
                          <IonItem>
                            <IonLabel>Role</IonLabel>
                            <IonSelect 
                              value={roleFilter} 
                              onIonChange={e => setRoleFilter(e.detail.value)}
                            >
                              <IonSelectOption value="all">All</IonSelectOption>
                              <IonSelectOption value="user">User</IonSelectOption>
                              <IonSelectOption value="admin">Admin</IonSelectOption>
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
                    <p>Loading users...</p>
                  </div>
                )}
                
                {!isLoading && filteredUsers.length === 0 && (
                  <div className="ion-text-center ion-padding">
                    <IonText color="medium">
                      <p>No users found. Try adjusting your filters or add a new user.</p>
                    </IonText>
                    <IonButton onClick={openAddModal}>
                      <IonIcon icon={add} slot="start" /> Add New User
                    </IonButton>
                  </div>
                )}
                
                {!isLoading && filteredUsers.length > 0 && (
                  <IonList>
                    {filteredUsers.map(user => (
                      <IonItem key={user.id} className="ion-margin-bottom">
                        <IonAvatar slot="start">
                          <div style={{ 
                            backgroundColor: user.role === 'admin' ? '#3880ff' : '#f4f5f8', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                            color: user.role === 'admin' ? 'white' : '#92949c'
                          }}>
                            <IonIcon icon={personCircleOutline} />
                          </div>
                        </IonAvatar>
                        
                        <IonLabel>
                          <h2>{user.fullName || user.username}</h2>
                          <p>
                            <IonIcon icon={mailOutline} style={{ marginRight: '5px' }} />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p>
                              <IonIcon icon={callOutline} style={{ marginRight: '5px' }} />
                              {user.phone}
                            </p>
                          )}
                        </IonLabel>
                        
                        <IonChip 
                          color={user.role === 'admin' ? 'primary' : 'medium'}
                          slot="end"
                        >
                          <IonIcon icon={shieldOutline} />
                          <IonLabel>{user.role}</IonLabel>
                        </IonChip>
                        
                        <IonButton fill="clear" slot="end" onClick={() => showOptions(user)}>
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
      
      {/* Add/Edit User Modal */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{isEditMode ? 'Edit User' : 'Add New User'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsModalOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <IonItem>
              <IonLabel position="stacked">Username *</IonLabel>
              <IonInput
                value={formData.username}
                onIonChange={e => handleInputChange('username', e.detail.value!)}
                placeholder="Enter username"
                required
              />
            </IonItem>
            
            {!isEditMode && (
              <IonItem>
                <IonLabel position="stacked">Email *</IonLabel>
                <IonInput
                  type="email"
                  value={formData.email}
                  onIonChange={e => handleInputChange('email', e.detail.value!)}
                  placeholder="Enter email address"
                  required
                />
              </IonItem>
            )}
            
            <IonItem>
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                value={formData.name}
                onIonChange={e => handleInputChange('name', e.detail.value!)}
                placeholder="Enter full name"
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Phone</IonLabel>
              <IonInput
                type="tel"
                value={formData.phone}
                onIonChange={e => handleInputChange('phone', e.detail.value!)}
                placeholder="Enter phone number"
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Address</IonLabel>
              <IonTextarea
                value={formData.address}
                onIonChange={e => handleInputChange('address', e.detail.value!)}
                placeholder="Enter address"
                rows={3}
              />
            </IonItem>
            
            {showRoleField && (
              <IonItem>
                <IonLabel position="stacked">Role</IonLabel>
                <IonSelect
                  value={selectedRole}
                  onIonChange={e => setSelectedRole(e.detail.value)}
                >
                  <IonSelectOption value="user">User</IonSelectOption>
                  <IonSelectOption value="admin">Administrator</IonSelectOption>
                </IonSelect>
              </IonItem>
            )}
            
            {!isEditMode && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Password *</IonLabel>
                  <IonInput
                    type="password"
                    value={formData.password}
                    onIonChange={e => handleInputChange('password', e.detail.value!)}
                    placeholder="Enter password"
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="stacked">Confirm Password *</IonLabel>
                  <IonInput
                    type="password"
                    value={passwordConfirm}
                    onIonChange={e => setPasswordConfirm(e.detail.value!)}
                    placeholder="Confirm password"
                    required
                  />
                </IonItem>
              </>
            )}
            
            <div className="ion-padding ion-text-center">
              <IonButton expand="block" type="submit">
                {isEditMode ? 'Update User' : 'Add User'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
      
      {/* User Detail Modal */}
      <IonModal isOpen={showUserDetail} onDidDismiss={() => setShowUserDetail(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>User Details</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowUserDetail(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          {selectedUser && (
            <IonCard>
              <div className="ion-text-center ion-padding-top">
                <IonAvatar style={{ margin: '0 auto', width: '80px', height: '80px' }}>
                  <div style={{ 
                    backgroundColor: selectedUser.role === 'admin' ? '#3880ff' : '#f4f5f8', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    color: selectedUser.role === 'admin' ? 'white' : '#92949c'
                  }}>
                    <IonIcon icon={personCircleOutline} size="large" />
                  </div>
                </IonAvatar>
                
                <IonCardHeader>
                  <IonCardTitle>{selectedUser.fullName || selectedUser.username}</IonCardTitle>
                  <IonChip 
                    color={selectedUser.role === 'admin' ? 'primary' : 'medium'}
                    className="ion-margin-top"
                  >
                    <IonIcon icon={shieldOutline} />
                    <IonLabel>{selectedUser.role}</IonLabel>
                  </IonChip>
                </IonCardHeader>
              </div>
              
              <IonCardContent>
                <IonList lines="full">
                  <IonItem>
                    <IonIcon icon={person} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Username</h3>
                      <p>{selectedUser.username}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem>
                    <IonIcon icon={mailOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Email</h3>
                      <p>{selectedUser.email}</p>
                    </IonLabel>
                  </IonItem>
                  
                  {selectedUser.phone && (
                    <IonItem>
                      <IonIcon icon={callOutline} slot="start" color="primary" />
                      <IonLabel>
                        <h3>Phone</h3>
                        <p>{selectedUser.phone}</p>
                      </IonLabel>
                    </IonItem>
                  )}
                  
                  {selectedUser.address && (
                    <IonItem>
                      <IonIcon icon={homeOutline} slot="start" color="primary" />
                      <IonLabel>
                        <h3>Address</h3>
                        <p>{selectedUser.address}</p>
                      </IonLabel>
                    </IonItem>
                  )}
                  
                  <IonItem>
                    <IonIcon icon={timeOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Member Since</h3>
                      <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </IonLabel>
                  </IonItem>
                </IonList>
                
                <div className="ion-padding ion-text-center">
                  <IonButton expand="block" onClick={() => {
                    setShowUserDetail(false);
                    openEditModal(selectedUser);
                  }}>
                    <IonIcon icon={create} slot="start" />
                    Edit User
                  </IonButton>
                  
                  {(!currentUser || selectedUser.id !== currentUser.id) && (
                    <IonButton 
                      expand="block" 
                      color="danger" 
                      onClick={() => {
                        setShowUserDetail(false);
                        confirmDelete(selectedUser);
                      }}
                    >
                      <IonIcon icon={trash} slot="start" />
                      Delete User
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </IonContent>
      </IonModal>
      
      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message={`Are you sure you want to delete ${userToDelete?.username}? This action cannot be undone.`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: handleDelete
          }
        ]}
      />
    </div>
  );
};

export default UserManagement;