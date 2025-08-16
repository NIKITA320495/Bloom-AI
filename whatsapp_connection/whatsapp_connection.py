import os
import json
from dotenv import load_dotenv
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from flask import request
from whatsapp_connection.whatsapp_orchestrator import whatsappOrchestrator
from langchain_ibm import WatsonxLLM
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams

# Load environment variables
load_dotenv()

class WhatsAppBot:
    def __init__(self):
        """Initialize WhatsApp bot with Twilio credentials and orchestrator"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        # Initialize LLM for WhatsApp orchestrator
        url = os.getenv("URL")
        apikey = os.getenv("API_KEY")
        project_id = os.getenv("PROJECT_ID")
        llm = WatsonxLLM(
            model_id="ibm/granite-3-8b-instruct",
            url=url,
            apikey=apikey,
            project_id=project_id,
            params={
                GenParams.DECODING_METHOD: "greedy",
                GenParams.TEMPERATURE: 0.1,
                GenParams.MIN_NEW_TOKENS: 10,
                GenParams.MAX_NEW_TOKENS: 200,
                GenParams.STOP_SEQUENCES: [
                    "Question:", 
                    "Human:", 
                    "Observation",
                    "USER QUESTION:",
                    "ASSISTANT:",
                    "User:"
                ],
            },
        )
        
        # Initialize WhatsApp orchestrator
        self.orchestrator = whatsappOrchestrator(llm)
        
        # Initialize Twilio client
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            print("Warning: Twilio credentials not found in environment variables")
            self.client = None
        
        # User session storage (in production, use a database)
        self.user_sessions = {}
        
        # Conversation states
        self.CONVERSATION_STATES = {
            'INITIAL': 'initial',
            'WAITING_FOR_SYMPTOMS': 'waiting_for_symptoms',
            'PROCESSING_QUERY': 'processing_query'
        }
    
    def process_whatsapp_message(self):
        """Process incoming WhatsApp message and return TwiML response"""
        try:
            # Get message details from Twilio webhook
            from_number = request.form.get('From')
            message_body = request.form.get('Body', '').strip()
            
            print(f"Received WhatsApp message from {from_number}: {message_body}")
            
            # Create TwiML response
            resp = MessagingResponse()
            
            # Handle empty messages
            if not message_body:
                resp.message("Hi! I'm Bloom, your menopause health assistant. Please send me your question about menopause, diet, exercise, or health consultation.")
                return str(resp)
            
            # Check for special commands
            if message_body.lower() in ['hi', 'hello', 'start', 'help']:
                welcome_message = self._get_welcome_message()
                resp.message(welcome_message)
                return str(resp)
            
            # Get user session to track conversation state
            user_session = self._get_user_session(from_number)
            user_id = from_number.replace('whatsapp:', '').replace('+', '')
            
            # Handle conversation flow based on user state
            if user_session['state'] == self.CONVERSATION_STATES['WAITING_FOR_SYMPTOMS']:
                # User was asked for symptoms and is now providing them
                symptoms = message_body
                self._update_user_session(from_number, {
                    'symptoms': symptoms,
                    'state': self.CONVERSATION_STATES['PROCESSING_QUERY'],
                    'has_provided_symptoms': True  # Mark that symptoms have been provided
                })
                
                # Now process the original query with symptoms
                original_query = user_session['pending_query']
                
                try:
                    # Use the new method that processes queries with symptoms as user logs
                    result = self.orchestrator.run_query_with_symptoms(original_query, symptoms, user_id)
                    response_text = str(result)
                    response_text = self._truncate_message(response_text)
                    resp.message(response_text)
                except Exception as e:
                    print(f"Error processing query with symptoms: {str(e)}")
                    error_message = "I'm sorry, I encountered an error processing your request. Please try again or contact support."
                    resp.message(error_message)
                
                # Reset session state but keep symptoms
                self._update_user_session(from_number, {
                    'state': self.CONVERSATION_STATES['INITIAL'],
                    'pending_query': None,
                    'has_provided_symptoms': True  # Mark that symptoms have been provided
                    # Keep symptoms in session for future use
                })
                
                return str(resp)
            
            # Check if this is a basic query that doesn't need symptoms
            if self._is_basic_query(message_body):
                # Process as basic query without needing symptoms
                try:
                    result = self.orchestrator.run_basic_query_without_user(message_body)
                    response_text = str(result)
                    response_text = self._truncate_message(response_text)
                    resp.message(response_text)
                except Exception as e:
                    print(f"Error processing basic query: {str(e)}")
                    error_message = "I'm sorry, I encountered an error processing your request. Please try again or contact support."
                    resp.message(error_message)
                
                return str(resp)
            
            # For all other queries (consultation, diet, exercise), check if we have symptoms
            if user_session['has_provided_symptoms'] and user_session['symptoms']:
                # User has already provided symptoms, use them directly
                try:
                    result = self.orchestrator.run_query_with_symptoms(message_body, user_session['symptoms'], user_id)
                    response_text = str(result)
                    response_text = self._truncate_message(response_text)
                    resp.message(response_text)
                except Exception as e:
                    print(f"Error processing query with saved symptoms: {str(e)}")
                    error_message = "I'm sorry, I encountered an error processing your request. Please try again or contact support."
                    resp.message(error_message)
                
                return str(resp)
            
            # Check if user wants to update their symptoms
            if message_body.lower() in ['update symptoms', 'change symptoms', 'new symptoms']:
                self._update_user_session(from_number, {
                    'state': self.CONVERSATION_STATES['WAITING_FOR_SYMPTOMS'],
                    'pending_query': 'update symptoms request',
                    'has_provided_symptoms': False,
                    'symptoms': None
                })
                
                symptom_request = self._ask_for_symptoms()
                resp.message(symptom_request)
                return str(resp)
            
            # For all other queries, ask for symptoms first (only if not provided before)
            self._update_user_session(from_number, {
                'state': self.CONVERSATION_STATES['WAITING_FOR_SYMPTOMS'],
                'pending_query': message_body
            })
            
            symptom_request = self._ask_for_symptoms()
            resp.message(symptom_request)
            
            return str(resp)
            
        except Exception as e:
            print(f"Error in process_whatsapp_message: {str(e)}")
            resp = MessagingResponse()
            resp.message("I'm sorry, something went wrong. Please try again later.")
            return str(resp)
    
    def send_whatsapp_message(self, to_number, message):
        """Send a WhatsApp message to a specific number"""
        if not self.client:
            print("Twilio client not initialized")
            return False
        
        try:
            message = self.client.messages.create(
                body=message,
                from_=f'whatsapp:{self.whatsapp_number}',
                to=f'whatsapp:{to_number}'
            )
            print(f"Message sent successfully. SID: {message.sid}")
            return True
        except Exception as e:
            print(f"Error sending WhatsApp message: {str(e)}")
            return False
    
    def _get_welcome_message(self):
        """Return welcome message for new users"""
        return """🌸 Hello! I am Bloom, your Menopause Health Assistant! 🌸

I'm here to help you with:
• General menopause questions
• Health consultations & symptoms
• Diet & nutrition advice
• Exercise recommendations

Just send me your question and I'll provide personalized guidance!
Simply type your question in any of these areas, and I'll provide personalized advice!"""
    
    def _get_user_data(self, phone_number):
        """Retrieve user data for personalization (placeholder for database integration)"""
        # In a real implementation, this would query a database
        # For now, return None or sample data
        return self.user_sessions.get(phone_number, None)
    
    def _save_user_data(self, phone_number, user_data):
        """Save user data for future sessions (placeholder for database integration)"""
        # In a real implementation, this would save to a database
        self.user_sessions[phone_number] = user_data
    
    def _get_user_session(self, phone_number):
        """Get user session data"""
        if phone_number not in self.user_sessions:
            self.user_sessions[phone_number] = {
                'state': self.CONVERSATION_STATES['INITIAL'],
                'pending_query': None,
                'symptoms': None,
                'profile': None,
                'has_provided_symptoms': False  # Track if user has provided symptoms
            }
        return self.user_sessions[phone_number]
    
    def _update_user_session(self, phone_number, updates):
        """Update user session data"""
        session = self._get_user_session(phone_number)
        session.update(updates)
        self.user_sessions[phone_number] = session
    
    def _is_basic_query(self, message):
        """Determine if a query is basic (general menopause information)"""
        basic_keywords = [
            'what is menopause', 'menopause symptoms', 'menopause stages', 
            'when does menopause start', 'perimenopause', 'postmenopause',
            'menopause definition', 'menopause causes', 'menopause age',
            'what are hot flashes', 'what are night sweats', 'menopause basics'
        ]
        
        message_lower = message.lower()
        
        # Check for exact basic question patterns
        for keyword in basic_keywords:
            if keyword in message_lower:
                return True
        
        # Check for general question patterns
        general_patterns = [
            'what is', 'what are', 'define', 'explain', 'tell me about',
            'how long does', 'when does', 'why does'
        ]
        
        menopause_terms = ['menopause', 'perimenopause', 'postmenopause', 'hot flash', 'night sweat']

        has_general_pattern = any(pattern in message_lower for pattern in general_patterns)
        has_menopause_term = any(term in message_lower for term in menopause_terms)
        
        return has_general_pattern and has_menopause_term
    
    def _ask_for_symptoms(self):
        """Generate message asking for symptoms"""
        return """To provide you with personalized advice for your health consultation, diet, or exercise question, I'd like to know more about your current situation.

Please describe any symptoms you're experiencing or concerns you have. For example:
• Hot flashes, night sweats, irregular periods
• Mood changes, sleep problems, weight gain
• Last menstrual period date
• Any specific health concerns or goals

🌸 Your symptoms will be saved for future queries. You can update them anytime by typing 'update symptoms'."""
    
    def _truncate_message(self, message, max_length=1500):
        """Truncate message to fit WhatsApp limits"""
        if len(message) <= max_length:
            return message
        
        # Find a good breaking point (end of sentence)
        truncated = message[:max_length]
        last_period = truncated.rfind('.')
        last_newline = truncated.rfind('\n')
        
        break_point = max(last_period, last_newline)
        if break_point > max_length * 0.8:  # If we found a good break point
            return message[:break_point + 1] + "\n\n[Message truncated - ask for more details if needed]"
        else:
            return truncated + "...\n\n[Message truncated - ask for more details if needed]"
    
    def register_user_profile(self, phone_number, profile_data):
        """Register user profile for personalized responses"""
        """
        Expected profile_data format:
        {
            "name": "User Name",
            "dob": "1975-05-15",
            "height": "5'6\"",
            "weight": "140 lbs",
            "smoking": "non-smoker",
            "alcohol": "occasional",
            "disease": ["hypertension"],
            "medication": ["lisinopril 10mg"],
            "irregular_periods": "yes"
        }
        """
        self._save_user_data(phone_number, profile_data)
        return True