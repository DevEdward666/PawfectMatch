import {
  IonAlert,
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonLoading,
  IonModal,
  IonNote,
  IonPage,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  arrowBack,
  calendar,
  close,
  mail,
  person,
  send,
  trash
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { MessageForm } from '../models/message.model';
import "./MessageDetail.css";
interface MessageDetailParams {
  id: string;
}

const MessageDetail: React.FC = () => {
  const { id } = useParams<MessageDetailParams>();
  const { 
    currentMessage, 
    fetchMessageById, 
    sendMessage, 
    deleteMessage, 
    isLoading, 
    error 
  } = useMessages();
  
  const { isLoggedIn, user } = useAuth();
  
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Load message when component mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (id) {
      fetchMessageById(parseInt(id));
    }
  }, [id,fetchMessageById]);
  // If user is not logged in, redirect to login
  // if (!isLoggedIn()) {
  //   return <Redirect to="/login" />;
  // }
  
  
  const handleDeleteClick = () => {
    setShowDeleteAlert(true);
  };
  
  const handleDeleteConfirm = async () => {
    await deleteMessage(parseInt(id));
    window.location.href = '/messages';
  };
  
  const handleOpenReplyModal = () => {
    setShowReplyModal(true);
  };
  
  const handleReplyChange = (e: CustomEvent) => {
    setReplyMessage(e.detail.value);
  };
  
  const handleSendReply = async () => {
    if (!currentMessage || !replyMessage) return;
    
    try {
      // Determine recipient ID (the sender of the current message)
      const receiverId = currentMessage.senderId;
      
      if (!receiverId) {
        setShowError(true);
        return;
      }
      
      const messageForm: MessageForm = {
        receiverId,
        subject: currentMessage.subject ? `Re: ${currentMessage.subject}` : 'Re: Your message',
        content: replyMessage
      };
      
      await sendMessage(messageForm);
      setShowReplyModal(false);
      setReplyMessage('');
      // Redirect back to messages
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error sending reply:', error);
      setShowError(true);
    }
  };
  
  // Format date to a readable form
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determine if current user is the sender
  const isCurrentUserSender = () => {
    if (!currentMessage || !user) return false;
    return currentMessage.senderId === user.id;
  };
  
  if (isLoading) {
    return <IonLoading isOpen={true} message="Loading message..." />;
  }
  
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/messages" />
            </IonButtons>
            <IonTitle>Message</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonText color="danger">
              <h5>Error loading message</h5>
              <p>{error}</p>
            </IonText>
            <IonButton onClick={() => fetchMessageById(parseInt(id))}>
              Try Again
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
  if (!currentMessage) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/messages" />
            </IonButtons>
            <IonTitle>Message</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonText color="medium">
              <h5>Message not found</h5>
              <p>The message you're looking for doesn't exist or has been deleted.</p>
            </IonText>
            <IonButton routerLink="/messages" color="petprimary">
              Back to Messages
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="petprimary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/messages" />
          </IonButtons>
          <IonTitle>{currentMessage.subject || 'No Subject'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDeleteClick}>
              <IonIcon slot="icon-only" icon={trash} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonCard className="message-card">
          <IonCardContent>
            <div className="message-header">
              <div className="sender-info">
                <IonAvatar className="sender-avatar">
                  {currentMessage.sender && currentMessage.sender.username ? (
                    <div className="avatar-text">
                      {currentMessage.sender.username.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <IonIcon icon={person} />
                  )}
                </IonAvatar>
                
                <div className="sender-details">
                  <h2 className="sender-name">
                    {currentMessage.sender ? 
                      (currentMessage.sender.fullName || currentMessage.sender.username) : 
                      'Unknown Sender'}
                  </h2>
                  <div className="message-meta">
                    <IonIcon icon={mail} color="medium" size="small" />
                    <span className="to-text">to {isCurrentUserSender() ? 
                      (currentMessage.receiver ? 
                        (currentMessage.receiver.fullName || currentMessage.receiver.username) : 
                        'Unknown Recipient') : 
                      'me'}</span>
                  </div>
                </div>
              </div>
              
              <div className="message-date">
                <IonIcon icon={calendar} color="medium" size="small" />
                <span>{formatDate(currentMessage.createdAt)}</span>
              </div>
            </div>
            
            <div className="message-divider"></div>
            
            <div className="message-subject">
              {currentMessage.subject || 'No Subject'}
            </div>
            
            <div className="message-body">
              {currentMessage.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
      
      <IonFooter>
        <IonToolbar>
          <IonButton 
            expand="block" 
            color="petprimary" 
            onClick={handleOpenReplyModal}
            disabled={isCurrentUserSender()}
          >
            <IonIcon slot="start" icon={arrowBack} />
            Reply
          </IonButton>
        </IonToolbar>
      </IonFooter>
      
      {/* Reply Modal */}
      <IonModal isOpen={showReplyModal} onDidDismiss={() => setShowReplyModal(false)}>
        <IonHeader>
          <IonToolbar color="petprimary">
            <IonButtons slot="start">
              <IonButton onClick={() => setShowReplyModal(false)}>
                <IonIcon slot="icon-only" icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>Reply</IonTitle>
            <IonButtons slot="end">
              <IonButton 
                onClick={handleSendReply} 
                disabled={!replyMessage}
              >
                <IonIcon slot="start" icon={send} />
                Send
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <IonItem lines="none">
            <IonLabel>
              <h2>To: {currentMessage.sender ? 
                (currentMessage.sender.fullName || currentMessage.sender.username) : 
                'Unknown Sender'}</h2>
              <p>Subject: {currentMessage.subject ? `Re: ${currentMessage.subject}` : 'Re: Your message'}</p>
            </IonLabel>
          </IonItem>
          
          <div className="reply-divider"></div>
          
          <div className="original-message">
            <IonNote>
              <div className="original-header">
                <span>On {formatDate(currentMessage.createdAt)}, {currentMessage.sender ? 
                  (currentMessage.sender.fullName || currentMessage.sender.username) : 
                  'Unknown Sender'} wrote:</span>
              </div>
              <div className="original-content">
                {currentMessage.content.split('\n').map((line, index) => (
                  <p key={index}>&gt; {line}</p>
                ))}
              </div>
            </IonNote>
          </div>
          
          <div className="reply-divider"></div>
          
          <div className="reply-textarea">
            <IonTextarea
              placeholder="Type your reply here..."
              value={replyMessage}
              onIonChange={handleReplyChange}
              rows={6}
              autoGrow
            />
          </div>
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
      
      {/* Error Alert */}
      <IonAlert
        isOpen={showError}
        onDidDismiss={() => setShowError(false)}
        header="Error"
        message="There was an error sending your reply. Please try again."
        buttons={['OK']}
      />
      
    </IonPage>
  );
};

export default MessageDetail;