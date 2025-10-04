from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import pickle
import os

class DisasterClassifier:
    def __init__(self):
        self.model = None
        self.load_or_train_model()
    
    def load_or_train_model(self):
        """Load existing model or train a new one"""
        model_path = "disaster_model.pkl"
        
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
        else:
            self.train_and_save_model(model_path)
    
    def train_and_save_model(self, model_path):
        """Train model with sample data"""
        # Sample training data (expand this with real data)
        training_data = [
            ("Heavy rain flooding streets water everywhere", "Flood"),
            ("Building on fire smoke flames help", "Fire"),
            ("Ground shaking earthquake buildings damaged", "Earthquake"),
            ("Car accident collision injured people", "Accident"),
            ("Emergency help needed urgent danger", "SOS"),
            ("River overflowing homes submerged flood", "Flood"),
            ("Forest fire spreading rapidly evacuate", "Fire"),
            ("Tremors felt building collapsed earthquake", "Earthquake"),
            ("Road accident multiple vehicles crash", "Accident"),
            ("Need immediate assistance unsafe situation", "SOS"),
            ("Flash flood warning water rising fast", "Flood"),
            ("Fire broke out in apartment complex", "Fire"),
            ("Aftershocks continuing building unstable", "Earthquake"),
            ("Highway pileup traffic accident", "Accident"),
            ("Woman being followed help urgently", "SOS"),
        ]
        
        texts = [text for text, _ in training_data]
        labels = [label for _, label in training_data]
        
        # Create pipeline with TF-IDF and Naive Bayes
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=100, ngram_range=(1, 2))),
            ('clf', MultinomialNB())
        ])
        
        self.model.fit(texts, labels)
        
        # Save model
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
    
    def classify(self, text: str) -> str:
        """Classify disaster type from text"""
        if not self.model:
            return "Other"
        
        try:
            prediction = self.model.predict([text])[0]
            return prediction
        except:
            return "Other"

# Global classifier instance
classifier = DisasterClassifier()

def get_disaster_type(text: str) -> str:
    """Get disaster type from text"""
    return classifier.classify(text)