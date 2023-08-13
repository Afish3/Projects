"""User model tests."""

# run these tests like:
#
#    python -m unittest test_user_model.py


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


class UserModelTestCase(TestCase):
    """Test views for messages."""

    def setUp(self):
        """Create test client, add sample data."""
        db.session.rollback()
        User.query.delete()
        user1 = User(
            username="user1",
            email="user1@example.com",
            password="password"
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            password="password"
        )
        db.session.add(user1)
        db.session.add(user2)
        db.session.commit()

        self.client = app.test_client()

    def tearDown(self):
        """Tear down the database and remove all data"""

        db.session.rollback()
        User.query.delete()
        Message.query.delete()
        Follows.query.delete()
        db.session.commit()

    def test_user_model(self):
        """Does basic model work?"""

        u = User(
            email="test@test.com",
            username="testuser",
            password="HASHED_PASSWORD"
        )

        db.session.add(u)
        db.session.commit()

        # User should have no messages & no followers
        self.assertEqual(len(u.messages), 0)
        self.assertEqual(len(u.followers), 0)

    def test_repr(self):
        user1 = User.query.filter(User.username == "user1").first()
        self.assertEqual(repr(user1), f"<User #{user1.id}: user1, user1@example.com>")

    def test_is_following(self):
        user1 = User.query.filter(User.username == "user1").first()
        user2 = User.query.filter(User.username == "user2").first()
        user1.following.append(user2)
        db.session.commit()
        self.assertTrue(user1.is_following(user2))
        self.assertFalse(user2.is_following(user1))

    def test_is_not_following(self):
        user1 = User.query.filter(User.username == "user1").first()
        user2 = User.query.filter(User.username == "user2").first()
        self.assertFalse(user1.is_following(user2))

    def test_is_followed_by(self):
        user1 = User.query.filter(User.username == "user1").first()
        user2 = User.query.filter(User.username == "user2").first()
        user1.followers.append(user2)
        db.session.commit()
        self.assertTrue(user1.is_followed_by(user2))
        self.assertFalse(user2.is_followed_by(user1))

    def test_is_not_followed_by(self):
        user1 = User.query.filter(User.username == "user1").first()
        user2 = User.query.filter(User.username == "user2").first()
        self.assertFalse(user1.is_followed_by(user2))

    def test_create_user(self):
        new_user = User.signup("new_user", "new_user@example.com", "password", "")
        db.session.commit()
        self.assertIsNotNone(new_user.id)

    def test_create_user_fail(self):
        from sqlalchemy.exc import IntegrityError
        with self.assertRaises(IntegrityError):
            User.signup("user1", "duplicate@example.com", "password", "")
            db.session.commit()

    def test_authenticate_valid(self):
        user = User.signup("new_user", "new_user@example.com", "password", "")
        db.session.commit()
        authenticated_user = User.authenticate("new_user", "password")
        self.assertEqual(authenticated_user, user)

    def test_authenticate_invalid_username(self):
        authenticated_user = User.authenticate("invalid_user", "password")
        self.assertFalse(authenticated_user)

    def test_authenticate_invalid_password(self):
        user = User.signup("user", "user@example.com", "password", "")
        db.session.commit()
        authenticated_user = User.authenticate("user", "invalid_password")
        self.assertFalse(authenticated_user)
