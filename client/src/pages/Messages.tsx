import { RefresherEventDetail } from '@ionic/core';
import {
  IonAlert,
  IonAvatar,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  add,
  close,
  mailOpen,
  pencil,
  person,
  send,
  trash
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { MessageForm } from '../models/message.model';
import "./Messages.css";
const Messages: React.FC = () => {
  const { 
    inboxMessages, 
    sentMessages, 
    fetchMessages, 
    sendMessage, 
    deleteMessage, 
    markAsRead, 
    isLoading, 
    error 
  } = useMessages();
  
  const { isLoggedIn } = useAuth();
  
  const [activeSegment, setActiveSegment] = useState<string>('inbox');
  const [searchText, setSearchText] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  
  const [messageForm, setMessageForm] = useState<MessageForm>({
    receiverId: 0,
    subject: '',
    content: ''
  });
  // Load messages when component mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  
  // Filter messages when search text changes or active segment changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const currentMessages = activeSegment === 'inbox' ? inboxMessages : sentMessages;
    
    if (searchText.trim() === '') {
      setFilteredMessages(currentMessages);
    } else {
      const filtered = currentMessages.filter(message => 
        (message.subject && message.subject.toLowerCase().includes(searchText.toLowerCase())) ||
        message.content.toLowerCase().includes(searchText.toLowerCase()) ||
        (activeSegment === 'inbox' && message.sender && 
          (message.sender.username?.toLowerCase().includes(searchText.toLowerCase()) || 
          (message.sender.fullName && message.sender.fullName.toLowerCase().includes(searchText.toLowerCase()))
        )) ||
        (activeSegment === 'sent' && message.receiver && 
          (message.receiver.username?.toLowerCase().includes(searchText.toLowerCase()) || 
          (message.receiver.fullName && message.receiver.fullName.toLowerCase().includes(searchText.toLowerCase()))
        ))
      );
      
      setFilteredMessages(filtered);
    }
  }, [searchText, inboxMessages, sentMessages, activeSegment]);
  
  // If user is not logged in, redirect to login
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }
  
  
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchMessages().then(() => {
      event.detail.complete();
    });
  };
  
  const handleSegmentChange = (e: CustomEvent) => {
    setActiveSegment(e.detail.value);
    setSearchText('');
  };
  
  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value);
  };
  
  const handleOpenMessage = (messageId: number) => {
    if (activeSegment === 'inbox') {
      markAsRead(messageId);
    }
    window.location.href = `/messages/${messageId}`;
  };
  
  const handleDeleteClick = (messageId: number) => {
    setMessageToDelete(messageId);
    setShowDeleteAlert(true);
  };
  
  const handleDeleteConfirm = () => {
    if (messageToDelete) {
      deleteMessage(messageToDelete);
      setMessageToDelete(null);
      setShowDeleteAlert(false);
    }
  };
  
  const handleComposeChange = (e: CustomEvent) => {
    const { name, value } = e.detail;
    setMessageForm({
      ...messageForm,
      [name]: value
    });
  };
  
  const handleSendMessage = async () => {
    if (messageForm.receiverId && messageForm.content) {
      await sendMessage(messageForm);
      setShowComposeModal(false);
      resetComposeForm();
    }
  };
  
  const resetComposeForm = () => {
    setMessageForm({
      receiverId: 0,
      subject: '',
      content: ''
    });
  };
  
  // Format date to a more readable form
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's within the last 7 days
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Truncate message content for preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonTitle>Messages</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeSegment} onIonChange={handleSegmentChange}>
            <IonSegmentButton value="inbox">
              <IonIcon icon={mailOpen} />
              <IonLabel>Inbox</IonLabel>
              {inboxMessages.filter(msg => !msg.isRead).length > 0 && (
                <IonBadge color="danger" className="message-badge">
                  {inboxMessages.filter(msg => !msg.isRead).length}
                </IonBadge>
              )}
            </IonSegmentButton>
            <IonSegmentButton value="sent">
              <IonIcon icon={send} />
              <IonLabel>Sent</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonChange={handleSearch}
            placeholder="Search messages"
            animated
            showCancelButton="focus"
          />
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        
        {isLoading ? (
          <IonLoading isOpen={true} message="Loading messages..." />
        ) : error ? (
          <div className="error-container">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton onClick={() => fetchMessages()}>
              Try Again
            </IonButton>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="empty-state">
            <IonIcon 
              icon={activeSegment === 'inbox' ? mailOpen : send} 
              color="medium" 
              size="large"
            />
            <IonText color="medium">
              <h5>
                {searchText
                  ? 'No messages matching your search'
                  : activeSegment === 'inbox'
                  ? 'Your inbox is empty'
                  : 'You haven\'t sent any messages'}
              </h5>
              <p>
                {searchText
                  ? 'Try a different search term'
                  : activeSegment === 'inbox'
                  ? 'Messages from other users will appear here'
                  : 'Messages you send will appear here'}
              </p>
            </IonText>
            {!searchText && (
              <IonButton 
                color="petprimary" 
                onClick={() => setShowComposeModal(true)}
              >
                <IonIcon slot="start" icon={pencil} />
                Compose Message
              </IonButton>
            )}
          </div>
        ) : (
          <IonList>
            {filteredMessages.map(message => (
              <IonItemSliding key={message.id}>
                <IonItem 
                  button
                  detail
                  onClick={() => handleOpenMessage(message.id)}
                  className={activeSegment === 'inbox' && !message.isRead ? 'unread-message' : ''}
                >
                  <IonAvatar slot="start">
                    {activeSegment === 'inbox' ? (
                      message.sender && message.sender.username ? (
                        <div className="avatar-text">
                          {message.sender.username.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <IonIcon icon={person} />
                      )
                    ) : (
                      message.receiver && message.receiver.username ? (
                        <div className="avatar-text">
                          {message.receiver.username.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <IonIcon icon={person} />
                      )
                    )}
                  </IonAvatar>
                  
                  <div className="message-content">
                    <div className="message-header">
                      <div className="message-from">
                        {activeSegment === 'inbox' ? (
                          message.sender ? (
                            message.sender.fullName || message.sender.username
                          ) : 'Unknown Sender'
                        ) : (
                          message.receiver ? (
                            message.receiver.fullName || message.receiver.username
                          ) : 'Unknown Recipient'
                        )}
                      </div>
                      <IonNote className="message-date">
                        {formatDate(message.createdAt)}
                      </IonNote>
                    </div>
                    
                    <div className="message-subject">
                      {activeSegment === 'inbox' && !message.isRead && (
                        <div className="unread-dot"></div>
                      )}
                      {message.subject || '(No subject)'}
                    </div>
                    
                    <div className="message-preview">
                      {truncateContent(message.content)}
                    </div>
                  </div>
                </IonItem>
                
                <IonItemOptions side="end">
                  <IonItemOption 
                    color="danger" 
                    onClick={() => handleDeleteClick(message.id)}
                  >
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton 
            color="petprimary" 
            onClick={() => setShowComposeModal(true)}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        
        {/* Compose Message Modal */}
        <IonModal isOpen={showComposeModal} onDidDismiss={() => setShowComposeModal(false)}>
          <IonHeader>
            <IonToolbar color="petprimary">
              <IonButtons slot="start">
                <IonButton onClick={() => setShowComposeModal(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>New Message</IonTitle>
              <IonButtons slot="end">
                <IonButton 
                  onClick={handleSendMessage} 
                  disabled={!messageForm.receiverId || !messageForm.content}
                >
                  <IonIcon slot="start" icon={send} />
                  Send
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">To*</IonLabel>
                <IonSelect 
                  name="receiverId" 
                  value={messageForm.receiverId}
                  onIonChange={handleComposeChange}
                  placeholder="Select recipient"
                  interface="action-sheet"
                  cancelText="Cancel"
                >
                  {/* Normally, this would be populated from a users API call */}
                  <IonSelectOption value={1}>Admin User</IonSelectOption>
                  <IonSelectOption value={2}>Support Team</IonSelectOption>
                  <IonSelectOption value={3}>John Smith</IonSelectOption>
                  <IonSelectOption value={4}>Jane Doe</IonSelectOption>
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Subject</IonLabel>
                <IonInput 
                  name="subject" 
                  value={messageForm.subject}
                  onIonChange={handleComposeChange}
                  placeholder="Enter a subject (optional)"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Message*</IonLabel>
                <IonTextarea 
                  name="content" 
                  value={messageForm.content}
                  onIonChange={handleComposeChange}
                  placeholder="Type your message here..."
                  rows={10}
                  required
                />
              </IonItem>
            </IonList>
          </IonContent>
        </IonModal>
        
        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Message"
          message="Are you sure you want to delete this message? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Delete',
              handler: handleDeleteConfirm,
              cssClass: 'danger'
            }
          ]}
        />
      </IonContent>
      
    </IonPage>
  );
};

export default Messages;