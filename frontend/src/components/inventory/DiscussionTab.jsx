import React, { useState, useEffect, useContext, useRef } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const DiscussionTab = ({ inventory }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  useEffect(() => {

    const fetchComments = async () => {
      try {
        const response = await api.get(`/comments/inventory/${inventory.id}`);
        setMessages(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };
    fetchComments();
    socketRef.current = io('http://localhost:5000', {
      withCredentials: true,
    });

    socketRef.current.emit('join_inventory', inventory.id);
    socketRef.current.on('receive_comment', (comment) => {
      setMessages((prev) => [...prev, comment]);
      scrollToBottom();
    });
    return () => {
      socketRef.current.emit('leave_inventory', inventory.id);
      socketRef.current.disconnect();
    };
  }, [inventory.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    try {

      const response = await api.post(`/comments/inventory/${inventory.id}`, { content: newMessage });
      const savedComment = response.data.data;

      setMessages((prev) => [...prev, savedComment]);

      socketRef.current.emit('send_comment', {
        room: `inventory_${inventory.id}`,
        comment: savedComment
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      alert("Failed to post comment.");
    }
  };

  return (
    <div className="p-2 d-flex flex-column" style={{ height: '600px' }}>
      <div className="bg-light p-3 rounded mb-3 flex-grow-1 overflow-auto border shadow-sm">
        {messages.length === 0 ? (
          <p className="text-center text-muted mt-5">No messages yet. Start the discussion!</p>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} className={`mb-3 ${msg.author?.id === user?.id ? 'text-end' : ''}`}>
              <div 
                className={`d-inline-block p-3 rounded shadow-sm text-start`}
                style={{ 
                  maxWidth: '75%', 
                  backgroundColor: msg.author?.id === user?.id ? '#cfe2ff' : '#ffffff',
                  border: msg.author?.id === user?.id ? '1px solid #9ec5fe' : '1px solid #dee2e6'
                }}
              >
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <strong className={msg.author?.id === user?.id ? 'text-primary' : 'text-dark'}>
                    {msg.author?.name || 'Unknown User'}
                  </strong>
                  <span className="text-muted ms-3">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="markdown-body text-break" style={{ fontSize: '0.95rem' }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {isAuthenticated ? (
        <Form onSubmit={handleSendMessage} className="mt-auto">
          <Form.Group className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type a message... (Markdown is supported!)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="ms-2 px-4">Send</Button>
          </Form.Group>
        </Form>
      ) : (
        <Alert variant="warning" className="text-center mb-0">
          You must be logged in to participate in the discussion.
        </Alert>
      )}
    </div>
  );
};

export default DiscussionTab;