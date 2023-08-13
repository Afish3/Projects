import os
from unittest import TestCase
from models import db, connect_db, Message, User, Follows

os.environ['DATABASE_URL'] = "postgresql:///warbler-test"

from app import app, CURR_USER_KEY

db.create_all()

# Don't have WTForms use CSRF at all
app.config['WTF_CSRF_ENABLED'] = False

class UserViewTestCase(TestCase):
    """Test views for users routes."""

    def setUp(self):
        """
        Creates test client. 
        Adds sample data. 
        Rollback any previously added and uncommitted data.
        Removes all data from all tables.
        """
        User.query.delete()
        Message.query.delete()

        self.client = app.test_client()
        app.config['TESTING'] = True

        self.user = User.signup(username="testuser",
                                    email="test@test.com",
                                    password="testuser",
                                    image_url=None)

        db.session.commit()

    def tearDown(self):
        """Tears down the database and remove all data."""

        db.session.rollback()
        User.query.delete()
        Message.query.delete()
        Follows.query.delete()

    def test_homepage_logged_out(self):
        """Tests homepage for logged out user."""

        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Sign up", response.data)

    def test_homepage_logged_in(self):
        """Tests homepage for logged in user."""

        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id

        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Log out", response.data)

    def test_signup_page(self):
        """Tests signup page."""

        response = self.client.get('/signup')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Join Warbler today.", response.data)

    def test_login_page(self):
        """Tests login page."""

        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Welcome back.", response.data)

    def test_users_page(self):
        """Tests listing of users."""

        response = self.client.get('/users')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<div class="row justify-content-end">', response.data)

    def test_user_profile_logged_in(self):
        """Tests user profile page for logged in user."""

        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id

        response = self.client.get('/users/profile')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Edit Your Profile.", response.data)

    def test_user_profile_logged_out(self):
        """Tests user profile page for logged out user."""

        response = self.client.get('/users/profile')
        self.assertEqual(response.status_code, 302)  # Redirect to login page

    def test_user_following_logged_in(self):
        """Tests user following page for logged in user."""

        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id

        response = self.client.get(f'/users/{self.user.id}/following')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<div class="col-sm-9">', response.data)

    def test_user_following_logged_out(self):
        """Tests user following page for logged out user."""

        response = self.client.get(f'/users/{self.user.id}/following')
        self.assertEqual(response.status_code, 302)  # Redirect to login page

    def test_user_delete_logged_in(self):
        """Tests user delete for logged in user."""

        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id

        response = self.client.post('/users/delete')
        self.assertEqual(response.status_code, 302)  # Redirect after successful delete
        deleted_user = User.query.get(self.user.id)
        self.assertIsNone(deleted_user)

    def test_user_delete_logged_out(self):
        """Tests user delete for logged out user."""
        
        response = self.client.post('/users/delete')
        self.assertEqual(response.status_code, 302)  # Redirect to login page

