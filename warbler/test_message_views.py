"""Message View tests."""

# run these tests like:
#
#    FLASK_ENV=production python -m unittest test_message_views.py


import os
from unittest import TestCase

from models import db, connect_db, Message, User, Likes

# BEFORE we import our app, let's set an environmental variable
# to use a different database for tests (we need to do this
# before we import our app, since that will have already
# connected to the database

os.environ['DATABASE_URL'] = "postgresql:///warbler-test"


# Now we can import app

from app import app, CURR_USER_KEY

# Create our tables (we do this here, so we only create the tables
# once for all tests --- in each test, we'll delete the data
# and create fresh new clean test data

db.create_all()

# Don't have WTForms use CSRF at all, since it's a pain to test

app.config['WTF_CSRF_ENABLED'] = False


class MessageViewTestCase(TestCase):
    """Test views for messages."""

    def setUp(self):
        """Create test client, add sample data."""

        db.session.rollback()
        User.query.delete()
        Message.query.delete()
        Likes.query.delete()

        self.client = app.test_client()

        self.user = User.signup(username="testuser",
                                    email="test@test.com",
                                    password="testuser",
                                    image_url=None)

        db.session.commit()

    def test_add_message(self):
        """Can user add a message?"""

        # Since we need to change the session to mimic logging in,
        # we need to use the changing-session trick:

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.user.id

            # Now, that session setting is saved, so we can have
            # the rest of ours test

            resp = c.post("/messages/new", data={"text": "Hello"})

            # Make sure it redirects
            self.assertEqual(resp.status_code, 302)

            msg = Message.query.one()
            self.assertEqual(msg.text, "Hello")

    def test_add_message_logged_out(self):
        """Test adding a message for logged out user."""
        response = self.client.post('/messages/new', data={'text': 'Test message'})
        self.assertEqual(response.status_code, 302)  # Redirect after unsuccessful post

    def test_delete_message(self):
        """Test deleting a message."""
        message = Message(text="Test message", user_id=self.user.id)
        db.session.add(message)
        db.session.commit()

        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id

        message_to_delete = Message.query.one()
        response = self.client.post(f'/messages/{message_to_delete.id}/delete')
        self.assertEqual(response.status_code, 302)  # Redirect after successful delete
        deleted_message = Message.query.get(message_to_delete.id)
        self.assertIsNone(deleted_message)

    def test_like_message_logged_in(self):
        """Test liking a message for logged-in user."""
        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id
            session['RECENT_URL'] = '/'

        message = Message(text="Test message", user_id=self.user.id)
        db.session.add(message)
        db.session.commit()

        with self.client.session_transaction() as session:
        # Fetch the message within the same session to prevent detached instance error
            message_to_like = Message.query.one()

        response = self.client.post(f'/users/add_like/{message_to_like.id}', follow_redirects=True)
        self.assertEqual(response.status_code, 200)

        # Fetch the user again within the same session to ensure the likes are properly loaded
        self.user = User.query.get(self.user.id)
        self.assertTrue(any(msg.id == message_to_like.id for msg in self.user.likes))

    # def test_unlike_message_logged_in(self):
    #     """Test unliking a message for logged-in user."""
            
    #     message = Message(text="Test message", user_id=self.user.id)
    #     db.session.add(message)
    #     db.session.commit()

    #     with self.client.session_transaction() as session:
    #         session[CURR_USER_KEY] = self.user.id
    #         session['RECENT_URL'] = '/'

    #     message_to_unlike = Message.query.one()
    #     self.user = User.query.get(self.user.id)
    #     self.user.likes.append(message_to_unlike)
    #     db.session.commit()

    #     response = self.client.post(f'/users/add_like/{message_to_unlike.id}', follow_redirects=True)
        
    #     self.assertEqual(response.status_code, 200)
    
    #     self.user = User.query.get(self.user.id) 
    #     self.assertTrue(any(msg.id == message_to_unlike.id for msg in self.user.likes))