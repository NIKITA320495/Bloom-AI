import pandas as pd
from datetime import datetime
import json
import ast
import os
from dotenv import load_dotenv

from langchain_ibm import WatsonxLLM
from langchain.memory import ConversationBufferMemory
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams

# --- Data Loading: This happens only once when the module is imported ---
try:
    users_df = pd.read_csv('data/userData.csv').set_index('user_id')
    symptom_logs_df = pd.read_csv('data/userLogData.csv').set_index('user_id')
    print("BasicQueryAgent: Data files loaded successfully.")
except FileNotFoundError as e:
    print(f"BasicQueryAgent FATAL ERROR: {e}. The agent will not have access to user data.")
    users_df = None
    symptom_logs_df = None

load_dotenv()

# --- Helper Function to process log data ---
def summarize_user_logs(log_data):
    if not log_data:
        return "No recent logs found for this user."
    summary_points = []
    symptom_columns = ['Hot Flash', 'Bloating', 'Cramps', 'Anxiety', 'Back Pain', 'Fatigue']
    for symptom in symptom_columns:
        if symptom in log_data and pd.notna(log_data[symptom]):
            try:
                dates = ast.literal_eval(log_data[symptom])
                if dates:
                    summary_points.append(f"- Logged '{symptom}' {len(dates)} times recently.")
            except (ValueError, SyntaxError): continue
    if 'mood' in log_data and pd.notna(log_data['mood']):
        try:
            mood_data = json.loads(log_data['mood'])
            if mood_data:
                summary_points.append(f"- Logged moods including: {', '.join(mood_data.keys())}.")
        except json.JSONDecodeError: pass
    if not summary_points:
        return "No specific symptoms or moods logged recently."
    return "\n".join(summary_points)


class BasicQueryAgent:
    def __init__(self, llm):
        self.llm = llm
        self.memory = ConversationBufferMemory()
        
    def run(self, user_query, user_profile=None, user_logs=None, conversation_context=None, is_first_query=False):
        """
        Runs the agent using the data provided by the orchestrator.
        """
        print("BasicQueryAgent running with data from orchestrator.")
        
        # Get user name for personalized responses
        user_name = user_profile.get('name', 'there') if user_profile else 'there'
 
        # --- Personalization Logic (now uses passed-in data) ---
        if user_profile:
            try:
                dob = datetime.strptime(user_profile['dob'], '%Y-%m-%d')
                age = datetime.now().year - dob.year - ((datetime.now().month, datetime.now().day) < (dob.month, dob.day))
                user_profile['age'] = age
            except (ValueError, TypeError):
                user_profile['age'] = 'unknown'
            profile_details = "\n".join([f"- {key.replace('_', ' ').title()}: {value}" for key, value in user_profile.items() if pd.notna(value)])
        else:
            profile_details = "No user profile available."

        log_summary = summarize_user_logs(user_logs)
        
        # Handle short responses differently
        is_short_response = len(user_query.strip().split()) <= 3 and user_query.lower().strip() in ['yes', 'no', 'ok', 'okay', 'sure', 'maybe', 'fine', 'good', 'bad', 'hello', 'hi']
        
        # Create context-aware greeting instructions
        if is_first_query:
            greeting_instruction = f"This is {user_name}'s FIRST interaction. Welcome them warmly to Bloom."
        elif is_short_response:
            greeting_instruction = f"User gave brief response '{user_query}'. Ask for more specific details."
        else:
            greeting_instruction = f"Returning user {user_name}. Use conversation history appropriately."
            
        # Simplified, focused prompt
        prompt = f"""You are Bloom, a menopause wellness guide for women.

USER PROFILE: {profile_details}
RECENT SYMPTOMS: {log_summary}
CONVERSATION HISTORY: {conversation_context or "No previous conversation history."}

USER'S QUESTION: "{user_query}"

INSTRUCTIONS:
- Answer ONLY the user's actual question: "{user_query}"
- Take the context from {profile_details} and {log_summary} to give more personalized response.
- If user says just "yes/no", ask them to be more specific
- Use conversation history for context but don't repeat it
- Keep response under 70 words
- Be helpful and empathetic
- Don't use markdown formatting
- Don't invent details not mentioned by user

1.  *If the user gives a simple greeting (like "hi", "hello"):* You must provide a "Personalized Proactive Greeting".
    - Greet them warmly by name and briefly introduce yourself.
    - Briefly summarize a key point from their recent logs.
    - Gently connect it to their age or potential menopause stage.
    - End by asking how you can help them explore this.

2.  *If the user asks a specific question:* You must provide a "Personalized Answer".
    - *Do not add* Greetings 
    - Give a direct answer to their question.
Your response:"""
        
        response = self.llm.invoke(prompt)
        cleaned_response = response.strip()
        self.memory.save_context({"input": user_query}, {"output": cleaned_response})
        return cleaned_response