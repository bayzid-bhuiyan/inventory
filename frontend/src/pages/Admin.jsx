import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Form, Badge, Button, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FaUserShield, FaBan, FaCheck, FaTrash, FaUserTie } from 'react-icons/fa';
import api from '../services/api';

const Admin = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSelectRow = (id) => {
    setSelectedUserId(selectedUserId === id ? null : id);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleToggleStatus = async (newIsBlocked, newIsAdmin) => {
    if (!selectedUserId) return;
    try {
      await api.patch(`/users/${selectedUserId}/status`, {
        isBlocked: newIsBlocked,
        isAdmin: newIsAdmin
      });
      
      if (selectedUserId === user.id) {
        if (newIsBlocked) {
          window.location.href = '/blocked';
          return;
        }
        if (!newIsAdmin) {
          window.location.href = '/';
          return;
        }
      }
      fetchUsers(); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    const isSelf = selectedUserId === user.id;
    const warningMsg = isSelf 
      ? "Are you sure you want to permanently delete YOUR OWN account? You will be logged out immediately."
      : "Are you sure you want to permanently delete this user? This cannot be undone.";

    if (!window.confirm(warningMsg)) return;
    
    try {
      await api.delete(`/users/${selectedUserId}`);
      
      if (isSelf) {
        await logout(); 
        window.location.href = '/'; 
        return;
      }
      setSelectedUserId(null); 
      fetchUsers(); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  
  if (!user || !user.isAdmin) {
    return (
      <Container className="text-center mt-5">
        <h2 className="text-danger">🛡️ Access Denied</h2>
        <p>You must be an administrator to view this page.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">🛡️ Admin Dashboard</h2>

      <div className="d-flex bg-light p-2 rounded border mb-3 shadow-sm align-items-center">
        <span className="me-auto text-muted small ps-2">
          {selectedUser ? `Selected: ${selectedUser.name}` : "Select a user to manage"}
        </span>
        
        <div className="border-start ps-3">
          <Button 
            variant={selectedUser?.isAdmin ? "outline-warning" : "outline-primary"} 
            size="sm" className="me-2"
            disabled={!selectedUserId} 
            onClick={() => handleToggleStatus(selectedUser.isBlocked, !selectedUser.isAdmin)}
          >
            {selectedUser?.isAdmin ? <><FaUserTie className="me-1" /> Remove Admin</> : <><FaUserShield className="me-1" /> Make Admin</>}
          </Button>

          <Button 
            variant={selectedUser?.isBlocked ? "outline-success" : "outline-warning"} 
            size="sm" className="me-2"
            disabled={!selectedUserId} 
            onClick={() => handleToggleStatus(!selectedUser.isBlocked, selectedUser.isAdmin)}
          >
            {selectedUser?.isBlocked ? <><FaCheck className="me-1" /> Unblock User</> : <><FaBan className="me-1" /> Block User</>}
          </Button>

          <Button 
            variant="outline-danger" size="sm" 
            disabled={!selectedUserId} onClick={handleDeleteUser}
          >
            <FaTrash className="me-1" /> Delete User
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((targetUser) => (
                <tr 
                  key={targetUser.id} 
                  onClick={() => handleSelectRow(targetUser.id)}
                  className={selectedUserId === targetUser.id ? 'table-primary' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <Form.Check 
                      type="radio" 
                      checked={selectedUserId === targetUser.id} 
                      onChange={() => handleSelectRow(targetUser.id)} 
                    />
                  </td>
                  <td>
                    <img 
                      src={targetUser.avatar || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      className="rounded-circle me-2" 
                      style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                    />
                    <span className="fw-bold">{targetUser.name}</span>
                  </td>
                  <td>{targetUser.email}</td>
                  <td>
                    {targetUser.isAdmin ? (
                      <Badge bg="primary"><FaUserShield className="me-1"/> Admin</Badge>
                    ) : (
                      <Badge bg="secondary">User</Badge>
                    )}
                  </td>
                  <td>
                    {targetUser.isBlocked ? (
                      <Badge bg="danger"><FaBan className="me-1"/> Blocked</Badge>
                    ) : (
                      <Badge bg="success"><FaCheck className="me-1"/> Active</Badge>
                    )}
                  </td>
                  <td>{new Date(targetUser.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Admin;