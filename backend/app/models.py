from sqlalchemy import Column, Integer, String, create_engine, ForeignKey, Text, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from datetime import datetime, timezone

Base = declarative_base()

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    status = Column(String)
    creator = Column(String, nullable=True)
    players = relationship("Player", back_populates="room", cascade="all, delete-orphan", passive_deletes=True)

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=False, index=True)  # client_id
    username = Column(String, unique=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"))
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    room = relationship("Room", back_populates="players")

class VotingGameState(Base):
    __tablename__ = "voting_game_states"
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, unique=True, index=True)
    players = Column(Text)  # JSON string of player list
    questions = Column(Text)  # JSON string of remaining questions
    current_question = Column(String)
    votes = Column(Text)  # JSON string of votes dict
    start_time = Column(Float)
    duration = Column(Integer, default=20)
    finished = Column(Boolean, default=False)
    winners = Column(Text, nullable=True)  # JSON string of winners
    vote_counts = Column(Text, nullable=True)  # JSON string of vote counts

class MemeGameState(Base):
    __tablename__ = "meme_game_states"
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, unique=True, index=True)
    players = Column(Text)  # JSON string of player list
    creator = Column(String)
    meme_pool = Column(Text)  # JSON string of remaining memes
    current_meme = Column(Text)  # JSON string of current meme
    captions = Column(Text)  # JSON string of captions dict
    votes = Column(Text)  # JSON string of votes dict
    phase = Column(String, default="captioning")  # captioning, voting, results
    start_time = Column(Float)
    duration = Column(Integer, default=60)
    points = Column(Text)  # JSON string of points dict
    submissions = Column(Text)  # JSON string of submissions dict

class CAHGameState(Base):
    __tablename__ = "cah_game_states"
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, unique=True, index=True)
    players = Column(Text)  # JSON list of usernames
    creator = Column(String)
    question_pool = Column(Text)  # JSON list of remaining questions
    card_pool = Column(Text)  # JSON list of remaining cards
    current_question = Column(Text)  # JSON object for current question
    player_hands = Column(Text)  # JSON dict {username: [cards]}
    submissions = Column(Text)  # JSON dict {username: [cards]}
    votes = Column(Text)  # JSON dict {voter_username: voted_username}
    phase = Column(String, default="playing")  # playing, voting, results
    start_time = Column(Float)
    duration = Column(Integer, default=60)
    scores = Column(Text)  # JSON dict {username: score}
    round = Column(Integer, default=1)
    card_czar = Column(String)  # username of current czar
    czar_index = Column(Integer, default=0)

