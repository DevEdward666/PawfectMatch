import {
  IonBadge,
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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonActionSheet
} from '@ionic/react';
import { formatDistanceToNow } from 'date-fns';
import {
  arrowBack,
  checkmarkCircle,
  eyeOutline,
  mail,
  mailOutline,
  refreshOutline,
  trashOutline
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { Message } from '../../models/message.model';

const MessageManagement: React.FC = () => {
  const {
    allMessages,
    currentPage,
    totalPages,
    isLoading,
    fetchAllMessages,
    adminDeleteMessage
  } = useMessages();
  
  const [activeView, setActiveView] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [present] = useIonActionSheet();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      try {
        await fetchAllMessages(1, 50);
      } catch (error) {
        console.error('Error loading messages:', error);
        setToastMessage('Failed to load messages. Please try again.');
        setShowToast(true);
      }
    };
    init();
  }, [fetchAllMessages]);
  
  const loadMessages = async () => {
    try {
      await fetchAllMessages(1, 50);
    } catch (error) {
      console.error('Error loading messages:', error);
      setToastMessage('Failed to load messages. Please try again.');
      setShowToast(true);
    }
  };
  
  const loadMore = async (event: CustomEvent) => {
    if (currentPage < totalPages) {
      try {
        await fetchAllMessages(currentPage + 1, 50);
        if (event.target) {
          (event.target as any).complete();
        }
      } catch (error) {
        console.error('Error loading more messages:', error);
        setToastMessage('Failed to load more messages. Please try again.');
        setShowToast(true);
        if (event.target) {
          (event.target as any).complete();
        }
      }
    } else {
      if (event.target) {
        (event.target as any).complete();
        (event.target as any).disabled = true;
      }
    }
  };
  
  // const handleRefresh = async (event: CustomEvent) => {
  //   try {
  //     await fetchAllMessages(1, 50);
  //     if (event.detail) {
  //       event.detail.complete();
  //     }
  //   } catch (error) {
  //     console.error('Error refreshing messages:', error);
  //     setToastMessage('Failed to refresh messages. Please try again.');
  //     setShowToast(true);
  //     if (event.detail) {
  //       event.detail.complete();
  //     }
  //   }
  // };
  
  const handleDeleteMessage = (messageId: number) => {
    present({
      header: 'Delete Message',
      subHeader: 'Are you sure you want to delete this message?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            adminDeleteMessage(messageId)
              .then(() => {
                setToastMessage('Message deleted successfully');
                setShowToast(true);
              })
              .catch(() => {
                setToastMessage('Failed to delete message');
                setShowToast(true);
              });
          }
        }
      ]
    });
  };
  
  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const filteredMessages = allMessages
    .filter(message => {
      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          message.subject?.toLowerCase().includes(searchLower) ||
          message.content.toLowerCase().includes(searchLower) ||
          message.sender?.username?.toLowerCase().includes(searchLower) ||
          message.receiver?.username?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(message => {
      // Filter by read status
      if (activeView === 'read') {
        return message.isRead;
      }
      if (activeView === 'unread') {
        return !message.isRead;
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
                    <div>Message Management</div>
                    <IonButton fill="clear" onClick={loadMessages}>
                      <IonIcon icon={refreshOutline} />
                    </IonButton>
                  </div>
                </IonCardTitle>
                <IonSegment value={activeView} onIonChange={e => setActiveView(e.detail.value as string)}>
                  <IonSegmentButton value="all">
                    <IonLabel>All</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="unread">
                    <IonLabel>Unread</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="read">
                    <IonLabel>Read</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
                <div className="ion-padding-top">
                  <IonSearchbar
                    value={searchText}
                    onIonChange={e => setSearchText(e.detail.value || '')}
                    placeholder="Search messages"
                  />
                </div>
              </IonCardHeader>
              <IonCardContent>
                {isLoading && allMessages.length === 0 ? (
                  <div className="ion-text-center ion-padding">
                    <IonSpinner name="crescent" />
                    <p>Loading messages...</p>
                  </div>
                ) : filteredMessages.length > 0 ? (
                  <>
                    <IonList lines="full">
                      {filteredMessages.map(message => (
                        <IonItem key={message.id} detail={false} className={!message.isRead ? 'unread-message' : ''}>
                          <IonIcon
                            icon={message.isRead ? mailOutline : mail}
                            slot="start"
                            color={message.isRead ? 'medium' : 'primary'}
                          />
                          <IonLabel onClick={() => handleViewMessage(message)}>
                            <h2>
                              {message.subject || '(No Subject)'}
                              {!message.isRead && (
                                <IonBadge color="primary" style={{ marginLeft: '8px' }}>
                                  New
                                </IonBadge>
                              )}
                            </h2>
                            <h3>
                              From: {message.sender?.username || 'Unknown'} | To: {message.receiver?.username || 'Unknown'}
                            </h3>
                            <p>{message.content.length > 100 ? `${message.content.substring(0, 100)}...` : message.content}</p>
                            <p className="message-time">{formatDate(message.createdAt)}</p>
                          </IonLabel>
                          <IonButton
                            fill="clear"
                            slot="end"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <IonIcon icon={trashOutline} color="danger" />
                          </IonButton>
                          <IonButton
                            fill="clear"
                            slot="end"
                            onClick={() => handleViewMessage(message)}
                          >
                            <IonIcon icon={eyeOutline} color="primary" />
                          </IonButton>
                        </IonItem>
                      ))}
                    </IonList>
                    
                    {currentPage < totalPages && (
                      <IonInfiniteScroll threshold="100px" onIonInfinite={loadMore}>
                        <IonInfiniteScrollContent
                          loadingSpinner="bubbles"
                          loadingText="Loading more messages..."
                        />
                      </IonInfiniteScroll>
                    )}
                  </>
                ) : (
                  <div className="ion-text-center ion-padding">
                    <IonText color="medium">
                      <p>No messages found</p>
                    </IonText>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
      
      {/* Message Detail Modal */}
      <IonModal isOpen={showMessageDetail} onDidDismiss={() => setShowMessageDetail(false)}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setShowMessageDetail(false)}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>{selectedMessage?.subject || '(No Subject)'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => {
                if (selectedMessage) {
                  handleDeleteMessage(selectedMessage.id);
                  setShowMessageDetail(false);
                }
              }}>
                <IonIcon slot="icon-only" icon={trashOutline} color="danger" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selectedMessage && (
            <div>
              <div className="message-header ion-padding-bottom">
                <p>
                  <strong>From:</strong> {selectedMessage.sender?.username || 'Unknown'} ({selectedMessage.sender?.email || ''})
                </p>
                <p>
                  <strong>To:</strong> {selectedMessage.receiver?.username || 'Unknown'} ({selectedMessage.receiver?.email || ''})
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> 
                  <IonChip color={selectedMessage.isRead ? 'success' : 'primary'}>
                    <IonIcon icon={selectedMessage.isRead ? checkmarkCircle : mail} />
                    <IonLabel>{selectedMessage.isRead ? 'Read' : 'Unread'}</IonLabel>
                  </IonChip>
                </p>
              </div>
              <div className="message-divider"></div>
              <div className="message-content ion-padding-top">
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.content}</p>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
      
      {/* Toast notification */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
      />
    </div>
  );
};

export default MessageManagement;