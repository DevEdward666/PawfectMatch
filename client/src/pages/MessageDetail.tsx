import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonText,
  IonTextarea,
  IonFooter,
  IonLoading,
  IonAlert,
  IonItem,
  IonLabel,
  IonNote,
  IonModal
} from '@ionic/react';
import {
  person,
  trash,
  reply,
  arrowBack,
  send,
  close,
  calendar,
  mail
} from 'ionicons/icons';
import { useParams } from 'react-router';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageForm } from '../models/message.model';
import { Redirect } from 'react-router-dom';

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
  
  // If user is not logged in, redirect to login
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }
  
  // Load message when component mounts
  useEffect(() => {
    if (id) {
      fetchMessageById(parseInt(id));
    }
  }, [id]);
  
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
            <IonIcon slot="start" icon={reply} />
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
      
      <style jsx>{`
        .message-card {
          margin: 0;
          box-shadow: none;
          border-radius: 0;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 16px;
        }
        
        .sender-info {
          display: flex;
          align-items: center;
        }
        
        .sender-avatar {
          margin-right: 12px;
          width: 40px;
          height: 40px;
        }
        
        .avatar-text {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--ion-color-petprimary);
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .sender-details {
          display: flex;
          flex-direction: column;
        }
        
        .sender-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .message-meta {
          display: flex;
          align-items: center;
          color: var(--ion-color-medium);
          font-size: 0.8rem;
          margin-top: 2px;
        }
        
        .message-meta ion-icon {
          margin-right: 4px;
        }
        
        .to-text {
          margin-left: 4px;
        }
        
        .message-date {
          display: flex;
          align-items: center;
          color: var(--ion-color-medium);
          font-size: 0.8rem;
        }
        
        .message-date ion-icon {
          margin-right: 4px;
        }
        
        .message-divider {
          height: 1px;
          background-color: var(--ion-color-light-shade);
          margin: 12px 0;
        }
        
        .message-subject {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--ion-color-dark);
        }
        
        .message-body {
          font-size: 1rem;
          line-height: 1.5;
          color: var(--ion-color-dark);
        }
        
        .message-body p {
          margin: 0 0 12px 0;
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
          height: 100%;
        }
        
        .reply-divider {
          height: 1px;
          background-color: var(--ion-color-light-shade);
          margin: 16px 0;
        }
        
        .original-message {
          padding: 0 16px;
        }
        
        .original-header {
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        
        .original-content {
          font-size: 0.9rem;
          color: var(--ion-color-medium);
        }
        
        .original-content p {
          margin: 0 0 6px 0;
        }
        
        .reply-textarea {
          margin: 0 10px;
        }
      `}</style>
    </IonPage>
  );
};

export default MessageDetail;