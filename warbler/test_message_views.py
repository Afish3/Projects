"""Message View tests.

run these tests like:

   FLASK_ENV=production python -m unittest test_message_views.py

"""

import os
from unittest import TestCase
from models import db, connect_db, Message, User, Likes

# set an environmental variable to use a different database for tests 
os.environ['DATABASE_URL'] = "postgresql:///warbler-test"

from app import app, CURR_USER_KEY

db.create_all()

# Don't have WTForms use CSRF at all
app.config['WTF_CSRF_ENABLED'] = False

class MessageViewTestCase(TestCase):
    """Test views for messages."""

    def setUp(self):
        """
        Creates test client. 
        Adds sample data. 
        Rollback any previously added and uncommitted data.
        Removes all data from all tables.
        """

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

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.user.id

            resp = c.post("/messages/new", data={"text": "Hello"})
            self.assertEqual(resp.status_code, 302)

            msg = Message.query.one()
            self.assertEqual(msg.text, "Hello")

    def test_add_message_logged_out(self):
        """Tests adding a message for logged out user."""

        response = self.client.post('/messages/new', data={'text': 'Test message'})
        self.assertEqual(response.status_code, 302)  # Redirect after unsuccessful post

    def test_delete_message(self):
        """Tests deleting a message."""

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
        """Tests liking a message for logged-in user."""

        with self.client.session_transaction() as session:
            session[CURR_USER_KEY] = self.user.id
            session['RECENT_URL'] = '/' # for saving page state

        message = Message(text="Test message", user_id=self.user.id)
        db.session.add(message)
        db.session.commit()

        with self.client.session_transaction() as session:
        # Fetch the message within the same session to prevent detached instance error
            message_to_like = Message.query.one()

        response = self.client.post(f'/users/add_like/{message_to_like.id}', follow_redirects=True)
        self.assertEqual(response.status_code, 200)

        self.user = User.query.get(self.user.id)
        self.assertTrue(any(msg.id == message_to_like.id for msg in self.user.likes))