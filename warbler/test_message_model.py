import os
from unittest import TestCase

from models import db, User, Message, Follows

# BEFORE we import our app, let's set an environmental variable
# to use a different database for tests (we need to do this
# before we import our app, since that will have already
# connected to the database

os.environ['DATABASE_URL'] = "postgresql:///warbler-test"


# Now we can import app

from app import app

# Create our tables (we do this here, so we only create the tables
# once for all tests --- in each test, we'll delete the data
# and create fresh new clean test data

db.create_all()

class MessageModelTestCase(TestCase):
    """Test views for messages."""

    def setUp(self):
        db.session.rollback()
        User.query.delete()
        user = User(
            username="user",
            email="user1@example.com",
            password="password"
        )
        db.session.add(user)
        db.session.commit()
        message = Message(text="Test message", user_id=user.id)
        db.session.add(message)
        db.session.commit()

    def tearDown(self):
        """Tear down the database and remove all data"""

        db.session.rollback()
        User.query.delete()

    def test_create_message(self):
        """Test deleting a message."""

        user = User.query.filter(User.username == "user").first()
        message2 = Message(
            text="This is a test message.",
            user_id=user.id
        )
        db.session.add(message2)
        db.session.commit()

        self.assertEqual(message2.text, "This is a test message.")
        self.assertEqual(message2.user_id, user.id)

    def test_delete_message(self):
        """Test deleting a message."""

        user = User.query.filter(User.username == "user").first()
        message = Message.query.filter(Message.user_id == user.id).first()
        message_id = message.id
        db.session.delete(message)
        db.session.commit()
        deleted_message = Message.query.get(message_id)
        self.assertIsNone(deleted_message)

    def test_user_messages_relationship(self):
        """Test user-messages relationship."""

        user = User.query.filter(User.username == "user").first()
        message = Message.query.filter(Message.user_id == user.id).first()
        self.assertEqual(len(user.messages), 1)
        self.assertEqual(user.messages[0], message)

    def test_message_user_relationship(self):
        """Test message-user relationship."""

        user = User.query.filter(User.username == "user").first()
        message = Message.query.filter(Message.user_id == user.id).first()
        self.assertEqual(message.user, user)
