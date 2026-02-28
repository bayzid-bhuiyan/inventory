import React, { useContext, useState } from 'react';
import { Navbar, Nav, Container, Form, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaMoon, FaSun } from 'react-icons/fa';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const AppNavbar = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const { user, isAuthenticated, logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); 
    }
  };

  return (
    <Navbar bg={theme === 'dark' ? 'dark' : 'primary'} variant="dark" expand="lg" className="mb-4 shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">{t('navbar.brand')}</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">{t('navbar.home')}</Nav.Link>
            
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/personal">{t('navbar.personal')}</Nav.Link>
                {user?.isAdmin && (
                  <Nav.Link as={Link} to="/admin">{t('navbar.admin')}</Nav.Link>
                )}
              </>
            )}
          </Nav>

          <Form className="d-flex mx-lg-3 my-2 my-lg-0" onSubmit={handleSearch}>
            <Form.Control
              type="search"
              placeholder={t('navbar.search')}
              className="me-2 bg-light text-dark"
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Form>

          <Nav className="align-items-center">
            <Dropdown className="me-3">
              <Dropdown.Toggle variant={theme === 'dark' ? 'outline-light' : 'light'} size="sm">
                {i18n.language.toUpperCase()}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => changeLanguage('en')}>English</Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage('bn')}>বাংলা</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Button 
              variant={theme === 'dark' ? 'outline-light' : 'light'} 
              size="sm" 
              onClick={toggleTheme} 
              className="me-3 d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </Button>

            {isAuthenticated ? (
              <div className="d-flex align-items-center">
                <span className="text-light me-3 fw-bold">{user?.name}</span>
                <Button variant="danger" size="sm" onClick={logout}>{t('navbar.logout')}</Button>
              </div>
            ) : (
              <Button as={Link} to="/login" variant="success" size="sm">
                {t('navbar.login')}
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;